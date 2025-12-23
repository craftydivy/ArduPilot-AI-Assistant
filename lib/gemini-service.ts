import type { VehicleState } from "./mavlink-interface"

export type AIResponse = {
  text: string
  actions?: AIAction[]
}

export type AIAction = {
  type: "arm" | "disarm" | "takeoff" | "land" | "rtl" | "flyTo" | "setMode"
  params?: Record<string, unknown>
}

// Client-side helper. POSTs to server proxy /api/gemini which keeps the API key secret.
export async function processWithGemini(userInput: { id: string; content: string; role: string; timestamp: string | Date }[], vehicleState: VehicleState): Promise<AIResponse> {
  try {
    const res = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userInput, vehicleState }),
    })

    if (!res.ok) throw new Error('Server returned ' + res.status)

    const data = await res.json()
    return data as AIResponse
  } catch {
    // Fallback to the built-in simulator to keep the UI functional
    return simulateGeminiResponse(userInput.filter((m) => m.role === 'user').map((m) => m.content).join(' '), vehicleState)
  }
}

// Function to simulate Gemini API responses for demo purposes (unchanged)
function simulateGeminiResponse(userInput: string, vehicleState: VehicleState): AIResponse {
  const lowerInput = userInput.toLowerCase()

  if (lowerInput.includes("takeoff") || lowerInput.includes("take off")) {
    const altitudeMatch = userInput.match(/(\d+)\s*(m|meters|meter)/i)
    const altitude = altitudeMatch ? Number.parseInt(altitudeMatch[1]) : 10

    return {
      text: `Taking off to ${altitude} meters altitude.`,
      actions: [
        { type: "setMode", params: { mode: "GUIDED" } },
        { type: "arm" },
        { type: "takeoff", params: { altitude } },
      ],
    }
  }

  if (lowerInput.includes("land")) {
    return {
      text: "Landing the vehicle at the current location.",
      actions: [{ type: "setMode", params: { mode: "LAND" } }],
    }
  }

  if (lowerInput.includes("rtl") || lowerInput.includes("return") || lowerInput.includes("home")) {
    return {
      text: "Returning to the launch location.",
      actions: [{ type: "rtl" }],
    }
  }

  if (lowerInput.includes("arm") && !lowerInput.includes("disarm")) {
    return {
      text: "Arming the vehicle.",
      actions: [{ type: "arm" }],
    }
  }

  if (lowerInput.includes("disarm")) {
    return {
      text: "Disarming the vehicle.",
      actions: [{ type: "disarm" }],
    }
  }

  if (lowerInput.includes("fly")) {
    let direction = ""
    let distance = 10 

    if (lowerInput.includes("north")) direction = "north"
    else if (lowerInput.includes("south")) direction = "south"
    else if (lowerInput.includes("east")) direction = "east"
    else if (lowerInput.includes("west")) direction = "west"

    const distanceMatch = userInput.match(/(\d+)\s*(m|meters|meter)/i)
    if (distanceMatch) {
      distance = Number.parseInt(distanceMatch[1])
    }

    if (direction) {
      const { latitude, longitude } = vehicleState
      let newLat = latitude
      let newLon = longitude

      const latDegPerMeter = 0.000009
      const lonDegPerMeter = 0.000011

      if (direction === "north") newLat += latDegPerMeter * distance
      else if (direction === "south") newLat -= latDegPerMeter * distance
      else if (direction === "east") newLon += lonDegPerMeter * distance
      else if (direction === "west") newLon -= lonDegPerMeter * distance

      return {
        text: `Flying ${direction} for ${distance} meters.`,
        actions: [
          { type: "setMode", params: { mode: "GUIDED" } },
          { type: "flyTo", params: { lat: newLat, lon: newLon, alt: vehicleState.altitude } },
        ],
      }
    }
  }

  if (lowerInput.includes("mode")) {
    const modes = ["stabilize", "althold", "loiter", "rtl", "auto", "guided"]
    for (const mode of modes) {
      if (lowerInput.includes(mode)) {
        return {
          text: `Changing flight mode to ${mode.toUpperCase()}.`,
          actions: [{ type: "setMode", params: { mode: mode.toUpperCase() } }],
        }
      }
    }
  }

  if (lowerInput.includes("status") || lowerInput.includes("how") || lowerInput.includes("what")) {
    if (lowerInput.includes("altitude") || lowerInput.includes("height")) {
      return {
        text: `The current altitude is ${vehicleState.altitude.toFixed(1)} meters above the home position.`,
      }
    }

    if (lowerInput.includes("battery")) {
      return {
        text: `The battery is currently at ${vehicleState.batteryVoltage.toFixed(1)}V which is approximately ${vehicleState.batteryPercent}% of capacity.`,
      }
    }

    if (lowerInput.includes("position") || lowerInput.includes("location") || lowerInput.includes("where")) {
      return {
        text: `The vehicle is currently at ${vehicleState.latitude.toFixed(6)}° latitude, ${vehicleState.longitude.toFixed(6)}° longitude, and ${vehicleState.altitude.toFixed(1)} meters altitude.`,
      }
    }

    if (lowerInput.includes("mode")) {
      return {
        text: `The vehicle is currently in ${vehicleState.mode} mode.`,
      }
    }

    return {
      text: `Current Status:
- Mode: ${vehicleState.mode}
- Armed: ${vehicleState.armed ? "Yes" : "No"}
- Altitude: ${vehicleState.altitude.toFixed(1)} meters
- Battery: ${vehicleState.batteryVoltage.toFixed(1)}V (${vehicleState.batteryPercent}%)
- Position: ${vehicleState.latitude.toFixed(6)}°, ${vehicleState.longitude.toFixed(6)}°
- Heading: ${vehicleState.heading.toFixed(0)}°
- Ground Speed: ${vehicleState.groundspeed.toFixed(1)} m/s`,
    }
  }

  if (lowerInput.includes("help") || lowerInput.includes("commands") || lowerInput.includes("what can you do")) {
    return {
      text: `I can help you control your drone with commands like:
- "Take off to 50 meters"
- "Fly north 100 meters"
- "Return to home"
- "Land now"
- "What's my battery level?"
- "Change mode to loiter"
- "What's my current status?"

Just tell me what you'd like to do!`,
    }
  }

  return {
    text: "I understand you want to interact with the drone, but I'm not sure what specific action you're requesting. You can ask me to take off, land, fly in a direction, return to home, or provide status information. How can I help you?",
  }
}
