import { Chat } from "@/components/chat"
import { ThemeToggle } from "@/components/theme-toggle"
import { VehicleStatus } from "@/components/vehicle-status"
import { FlightMap } from "@/components/flight-map"
import Image from "next/image"

export default function Home() {
  return (
    <main className="flex min-h-screen w-full flex-col items-center bg-background px-4 py-6 md:px-8 md:py-10">
      <header className="flex w-full max-w-6xl items-center justify-between rounded-2xl bg-card/70 px-4 py-3 shadow-sm backdrop-blur md:px-6">
        <div className="flex items-center gap-3">
          <Image src="/ardupilot_logo.png" alt="ArduPilot Logo" className="h-10 w-auto"
            width={200}
            height={50}
          />
          <h1 className="text-xl font-semibold text-foreground md:text-2xl">ArduPilot AI Assistant</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-500 ring-1 ring-emerald-500/30">Connected</span>
          <ThemeToggle />
        </div>
      </header>

      <section className="mt-6 flex w-full max-w-6xl flex-col gap-4 md:mt-8 md:flex-row">
        <div className="flex-1 overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
          <div className="border-b border-border/60 bg-muted/60 px-4 py-3">
            <h2 className="text-base font-semibold text-foreground">Vehicle Status</h2>
          </div>
          <div className="p-4 md:p-5">
            <VehicleStatus />
          </div>
        </div>
        <div className="flex-1 overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
          <div className="border-b border-border/60 bg-muted/60 px-4 py-3">
            <h2 className="text-base font-semibold text-foreground">Flight Data</h2>
          </div>
          <div className="p-4 md:p-5 h-[320px]">
            <FlightMap />
          </div>
        </div>
      </section>

      <section className="w-full max-w-6xl mt-4 md:mt-6">
        <Chat />
      </section>
    </main>
  )
}
