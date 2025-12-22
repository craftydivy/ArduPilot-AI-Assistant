"use client"

import { useEffect, useState } from "react"
import { mavlink, type VehicleState } from "@/lib/mavlink-interface"

export function VehicleStatus() {
  const [vehicleState, setVehicleState] = useState<VehicleState>(mavlink.getState())

  useEffect(() => {
    // Subscribe to vehicle state updates
    const unsubscribe = mavlink.addStateListener(setVehicleState)

    // Cleanup subscription on unmount
    return unsubscribe
  }, [])

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border/60 bg-card p-3">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Flight Mode</div>
          <div className="text-lg font-semibold text-foreground">{vehicleState.mode}</div>
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-3">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Armed</div>
          <div className="text-lg font-semibold text-foreground">{vehicleState.armed ? "Yes" : "No"}</div>
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-3">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Altitude</div>
          <div className="text-lg font-semibold text-foreground">{vehicleState.altitude.toFixed(1)} m</div>
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-3">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Battery</div>
          <div className="text-lg font-semibold text-foreground">
            {vehicleState.batteryVoltage.toFixed(1)}V ({vehicleState.batteryPercent}%)
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border/60 bg-card p-3">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Latitude</div>
          <div className="text-lg font-semibold text-foreground">{vehicleState.latitude.toFixed(6)}°</div>
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-3">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Longitude</div>
          <div className="text-lg font-semibold text-foreground">{vehicleState.longitude.toFixed(6)}°</div>
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-3">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Heading</div>
          <div className="text-lg font-semibold text-foreground">{vehicleState.heading.toFixed(0)}°</div>
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-3">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Ground Speed</div>
          <div className="text-lg font-semibold text-foreground">{vehicleState.groundspeed.toFixed(1)} m/s</div>
        </div>
      </div>
    </div>
  )
}
