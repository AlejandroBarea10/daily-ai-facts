import TerminalHeader from "@/components/terminal-header"
import EphemerisDisplay from "@/components/ephemeris-display"
import TerminalFooter from "@/components/terminal-footer"
import { getTodayEphemeris } from "@/lib/supabaseServer"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export default async function Home() {
  const ephemerisData = await getTodayEphemeris()

  return (
    <div className="min-h-screen bg-background text-foreground scanline">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <TerminalHeader />
        <EphemerisDisplay data={ephemerisData} />
        <TerminalFooter />
      </div>

      {/* CRT screen effect overlay */}
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent opacity-50" />
    </div>
  )
}
