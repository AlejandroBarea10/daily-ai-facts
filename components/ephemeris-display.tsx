"use client"

import { useEffect, useState } from "react"
import { formatDateLong } from "@/lib/formatDate"

export interface Ephemeris {
  date?: string
  day?: number
  month?: number
  year: number
  title: string
  description: string
  category?: "AI" | "TECH" | "COMPUTING" | string
}

interface EphemerisDisplayProps {
  data: Ephemeris | null
}

export default function EphemerisDisplay({ data }: EphemerisDisplayProps) {
  const [displayedText, setDisplayedText] = useState("")
  const [isTyping, setIsTyping] = useState(true)

  useEffect(() => {
    if (!isTyping || !data) return

    const fullText = data.description
    let index = 0

    const typingInterval = setInterval(() => {
      if (index < fullText.length) {
        setDisplayedText(fullText.slice(0, index + 1))
        index++
      } else {
        setIsTyping(false)
        clearInterval(typingInterval)
      }
    }, 30)

    return () => clearInterval(typingInterval)
  }, [isTyping, data])

  // If no data, show placeholder
  if (!data) {
    return (
      <main className="space-y-6">
        <div className="flex items-center justify-between text-sm">
          <div className="text-accent">
            {"["}
            TODAY
            {"]"}
          </div>
          <div className="px-2 py-1 border border-primary/50 text-primary text-xs">—</div>
        </div>

        <div className="text-3xl md:text-4xl font-bold text-primary/60 leading-none">—</div>

        <div className="text-5xl md:text-7xl font-bold text-primary text-glow leading-none">
          NO DATA
        </div>

        <h2 className="text-2xl md:text-3xl font-bold text-foreground text-balance">
          <span className="text-primary">{">"} </span>
          No hay efeméride para hoy
        </h2>

        <div className="bg-muted/50 border border-border p-6 min-h-[160px]">
          <p className="text-base md:text-lg leading-relaxed text-muted-foreground">
            Por favor, intenta más tarde.
          </p>
        </div>
      </main>
    )
  }

  // Format date from day/month to readable long format
  const dateStr = data.day && data.month ? formatDateLong(data.day, data.month) : "Unknown Date"

  return (
    <main className="space-y-6">
      {/* Date and category */}
      <div className="flex items-center justify-between text-sm">
        <div className="text-accent">
          {"["}
          {dateStr.toUpperCase()}
          {"]"}
        </div>
        <div className="px-2 py-1 border border-primary/50 text-primary text-xs">{data.category || "—"}</div>
      </div>

      {/* Year display */}
      <div className="text-3xl md:text-4xl font-bold text-primary/60 leading-none">{data.year}</div>

      {/* Day display - more prominent with formatted date */}
      <div className="text-5xl md:text-7xl font-bold text-primary text-glow leading-none">
        {dateStr}
      </div>

      {/* Title */}
      <h2 className="text-2xl md:text-3xl font-bold text-foreground text-balance">
        <span className="text-primary">{">"} </span>
        {data.title}
      </h2>

      {/* Description with typing effect */}
      <div className="bg-muted/50 border border-border p-6 min-h-[160px]">
        <p className="text-base md:text-lg leading-relaxed text-muted-foreground">
          {displayedText}
          {isTyping && <span className="cursor-blink text-primary">▊</span>}
        </p>
      </div>
    </main>
  )
}
