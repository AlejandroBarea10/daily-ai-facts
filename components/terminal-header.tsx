"use client"

import { useEffect, useState } from "react"

export default function TerminalHeader() {
  const [currentTime, setCurrentTime] = useState("")

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setCurrentTime(
        now.toLocaleTimeString("en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      )
    }

    updateTime()
    const interval = setInterval(updateTime, 1000)

    return () => clearInterval(interval)
  }, [])

  return (
    <header className="mb-8 border-b border-primary/30 pb-4">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-glow">
          <span className="text-primary">{">"}</span> TECH_HISTORY.SYS
        </h1>
        <div className="text-sm text-muted-foreground">[{currentTime}]</div>
      </div>
      <p className="text-sm text-muted-foreground">
        <span className="text-accent">$</span> Displaying daily AI & Technology milestones...
      </p>
    </header>
  )
}
