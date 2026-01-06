# 💾 Código Completo de la Integración

## 1. `lib/supabaseServer.ts` (NUEVO)

```typescript
import { createClient } from '@supabase/supabase-js'

// Server-side only client
// These env vars are NOT exposed to the frontend
const supabaseUrl = process.env.SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables. Check your .env.local file.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * Get today's date in UTC format (day, month, year)
 */
export function getTodayUTC() {
  const now = new Date()
  const utcYear = now.getUTCFullYear()
  const utcMonth = now.getUTCMonth() + 1 // getUTCMonth returns 0-11
  const utcDay = now.getUTCDate()

  return { day: utcDay, month: utcMonth, year: utcYear }
}

/**
 * Fetch ephemeris for today from Supabase
 */
export async function getTodayEphemeris() {
  try {
    const { day, month, year } = getTodayUTC()

    const { data, error } = await supabase
      .from('ephemerides')
      .select('*')
      .eq('day', day)
      .eq('month', month)
      .eq('year', year)
      .single() // Expect only one result

    if (error) {
      if (error.code === 'PGRST116') {
        // No row found
        return null
      }
      console.error('Error fetching ephemeris:', error.message)
      return null
    }

    return data
  } catch (error) {
    console.error('Unexpected error fetching ephemeris:', error)
    return null
  }
}
```

---

## 2. `app/page.tsx` (MODIFICADO)

### Antes:
```typescript
import TerminalHeader from "@/components/terminal-header"
import EphemerisDisplay from "@/components/ephemeris-display"
import TerminalFooter from "@/components/terminal-footer"

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground scanline">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <TerminalHeader />
        <EphemerisDisplay />
        <TerminalFooter />
      </div>

      {/* CRT screen effect overlay */}
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent opacity-50" />
    </div>
  )
}
```

### Después:
```typescript
import TerminalHeader from "@/components/terminal-header"
import EphemerisDisplay from "@/components/ephemeris-display"
import TerminalFooter from "@/components/terminal-footer"
import { getTodayEphemeris } from "@/lib/supabaseServer"

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
```

**Cambios clave:**
- `export default function` → `export default async function`
- Importa `getTodayEphemeris` desde `lib/supabaseServer`
- Obtiene datos: `const ephemerisData = await getTodayEphemeris()`
- Pasa datos: `<EphemerisDisplay data={ephemerisData} />`

---

## 3. `components/ephemeris-display.tsx` (MODIFICADO)

### Antes:
```typescript
"use client"

import { useEffect, useState } from "react"

interface Ephemeris {
  date: string
  year: number
  title: string
  description: string
  category: "AI" | "TECH" | "COMPUTING"
}

const todayEphemeris: Ephemeris = {
  date: "January 6",
  year: 2007,
  title: "Steve Jobs introduces the iPhone",
  description:
    "At Macworld 2007, Steve Jobs unveils the first iPhone, revolutionizing mobile computing and ushering in the smartphone era.",
  category: "TECH",
}

export default function EphemerisDisplay() {
  const [displayedText, setDisplayedText] = useState("")
  const [isTyping, setIsTyping] = useState(true)

  useEffect(() => {
    if (!isTyping) return

    const fullText = todayEphemeris.description
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
  }, [isTyping])

  return (
    <main className="space-y-6">
      {/* Date and category */}
      <div className="flex items-center justify-between text-sm">
        <div className="text-accent">
          {"["}
          {todayEphemeris.date.toUpperCase()}
          {"]"}
        </div>
        <div className="px-2 py-1 border border-primary/50 text-primary text-xs">{todayEphemeris.category}</div>
      </div>

      {/* Year display */}
      <div className="text-3xl md:text-4xl font-bold text-primary/60 leading-none">{todayEphemeris.year}</div>

      {/* Day display - more prominent */}
      <div className="text-5xl md:text-7xl font-bold text-primary text-glow leading-none">
        {todayEphemeris.date.toUpperCase()}
      </div>

      {/* Title */}
      <h2 className="text-2xl md:text-3xl font-bold text-foreground text-balance">
        <span className="text-primary">{">"} </span>
        {todayEphemeris.title}
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
```

### Después:
```typescript
"use client"

import { useEffect, useState } from "react"

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

  // Format date from day/month to readable format
  const dateStr = data.date || `${data.month || '?'}/${data.day || '?'}`

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

      {/* Day display - more prominent */}
      <div className="text-5xl md:text-7xl font-bold text-primary text-glow leading-none">
        {dateStr.toUpperCase()}
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
```

**Cambios clave:**
- Interfaz `Ephemeris` ahora recibe `date`, `day`, `month` como opcionales
- Nueva prop: `data: Ephemeris | null`
- Manejo de estado sin datos: `if (!data) { return <...sin datos...> }`
- Typing effect ahora depende de `data` existir
- Usamos `data.title`, `data.description`, etc. en lugar de `todayEphemeris`

---

## 4. `.env.local.example` (NUEVO)

```
# Supabase Configuration
# Get these values from your Supabase project settings:
# 1. Go to https://supabase.com/dashboard
# 2. Select your project
# 3. Go to Settings > API
# 4. Copy the "Project URL" and "anon public" key

SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key-here
```

---

## Resumen de Cambios

| Archivo | Tipo | Cambio |
|---------|------|--------|
| `lib/supabaseServer.ts` | Nuevo | Cliente Supabase + funciones de consulta |
| `app/page.tsx` | Modificado | Async + consulta Supabase + pasa props |
| `components/ephemeris-display.tsx` | Modificado | Recibe props + maneja estado nulo |
| `.env.local.example` | Nuevo | Plantilla variables de entorno |

**Total de cambios:** 
- 2 archivos nuevos
- 2 archivos modificados
- 0 archivos eliminados
- Diseño visual: SIN CAMBIOS ✓
- Claves sensibles: NO EXPUESTAS ✓
