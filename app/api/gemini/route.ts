import type { VehicleState } from '@/lib/mavlink-interface'

type Message = {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: string | Date
}

type AIResponse = {
  text: string
  actions?: Array<{ type: string; params?: Record<string, unknown> }>
}

const SYSTEM_PROMPT = `
You are an AI assistant for ArduPilot, designed to help control and monitor drones through natural language commands.
You can perform the following actions:
1. Arm and disarm the vehicle
2. Take off to a specified altitude
3. Change flight modes (GUIDED, LOITER, RTL, AUTO, etc.)
4. Fly in specific directions (north, south, east, west) for specified distances
5. Return to launch (RTL)
6. Provide information about the vehicle's current status

When responding to user requests:
- Be concise and clear
- Confirm the actions you're taking
- Prioritize safety at all times
- Ask for clarification if a command is ambiguous
- Never perform unsafe operations

Your responses should include both a text reply and any actions that should be executed.

you will be given an array of objects which represent the chat history as vairable CHAT_HISTORY. Each object will have the following properties:
Message = {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
}

repond by analyzing the chat history and the current vehicle state.
`

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const userInput: Message[] = body.userInput || []
    const vehicleState: VehicleState = body.vehicleState

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY
    if (!GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: 'GEMINI_API_KEY not configured' }), { status: 500 })
    }

    const payload = {
      contents: [
        {
          role: 'user',
          parts: [
            { text: SYSTEM_PROMPT },
            {
              text: `Current vehicle state:
                Mode: ${vehicleState?.mode}
                Armed: ${vehicleState?.armed}
                Altitude: ${vehicleState?.altitude}
                Position: ${vehicleState?.latitude}, ${vehicleState?.longitude}
                Battery: ${vehicleState?.batteryVoltage}V (${vehicleState?.batteryPercent}%)
                Heading: ${vehicleState?.heading}
                Ground Speed: ${vehicleState?.groundspeed}

                message history: ${JSON.stringify(userInput)}

                Respond with a JSON object containing the following:
                1. text: Your response to the user
                2. actions: Array of actions to perform (optional)

                DO NOT GIVE ANYTHING ELSE EXCEPT THE JSON OBJECT.`,
            },
          ],
        },
      ],
    }

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
    )

    const data = await res.json()

    // Attempt to extract the generated text similar to the client implementation
    const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text
    if (!generatedText) {
      return new Response(JSON.stringify({ error: 'No content from Gemini', raw: data }), { status: 500 })
    }

    let jsonString = generatedText
    if (generatedText.startsWith('```')) {
      const jsonMatch = generatedText.match(/```(?:json)?\s*([\s\S]*?)```/)
      if (jsonMatch && jsonMatch[1]) {
        jsonString = jsonMatch[1].trim()
      }
    }

    const parsed = JSON.parse(jsonString)

    const aiResponse: AIResponse = parsed

    return new Response(JSON.stringify(aiResponse), { status: 200 })
  } catch (error: unknown) {
    console.error('Error in /api/gemini:', error)
    return new Response(JSON.stringify({ error: String(error) }), { status: 500 })
  }
}
