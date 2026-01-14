#!/usr/bin/env node

/**
 * Script para generar automáticamente una efeméride
 * 
 * Por defecto: genera "mañana" en zona horaria Europe/Madrid (España)
 * Con TARGET_DATE: genera la fecha específica (formato YYYY-MM-DD)
 * 
 * Requisitos de entorno:
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 * - OPENAI_API_KEY
 * 
 * Opcionales:
 * - TARGET_DATE (formato YYYY-MM-DD, para backfill)
 * 
 * Uso: 
 *   node scripts/generate-ephemeris.js                   # Mañana en Spain TZ
 *   TARGET_DATE=2026-01-14 node scripts/generate-ephemeris.js  # Fecha específica
 * 
 * Características:
 * - ✅ Calcula fechas en Europe/Madrid (maneja DST automáticamente)
 * - ✅ Categorías inválidas se mapean automáticamente (MEDICAL → SCIENCE)
 * - ✅ Upsert en Supabase (evita duplicados con constraint unique)
 * - ✅ Idempotente (ejecutar dos veces = actualiza, no falla)
 */

import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Cargar .env.local
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const envPath = join(__dirname, '..', '.env.local')
dotenv.config({ path: envPath })

// ============================================================================
// ZONA HORARIA: Usar Europe/Madrid para calcular "mañana" correctamente
// ============================================================================
const TIMEZONE = 'Europe/Madrid'

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const openaiApiKey = process.env.OPENAI_API_KEY
const targetDateInput = process.env.TARGET_DATE // Format: YYYY-MM-DD

// Validar variables de entorno
if (!supabaseUrl || !supabaseServiceKey || !openaiApiKey) {
  console.error('❌ Error: Variables de entorno faltantes')
  console.error('Requeridas:')
  console.error('  - SUPABASE_URL')
  console.error('  - SUPABASE_SERVICE_ROLE_KEY')
  console.error('  - OPENAI_API_KEY')
  console.error('')
  console.error('Opcionales:')
  console.error('  - TARGET_DATE (formato YYYY-MM-DD, por defecto "mañana" en Europe/Madrid)')
  process.exit(1)
}

// ============================================================================
// CATEGORÍAS SOPORTADAS Y MAPEO
// ============================================================================

const VALID_CATEGORIES = ['AI', 'TECH', 'COMPUTING', 'SCIENCE']
const CATEGORY_MAPPING = {
  'MEDICAL': 'SCIENCE',
  'MEDICINE': 'SCIENCE',
  'HEALTH': 'SCIENCE',
  'BIOLOGY': 'SCIENCE',
  'PHYSICS': 'SCIENCE',
  'CHEMISTRY': 'SCIENCE',
  'MATHEMATICS': 'SCIENCE',
}

// ============================================================================
// INICIALIZAR CLIENTES
// ============================================================================

const supabase = createClient(supabaseUrl, supabaseServiceKey)
const openai = new OpenAI({ apiKey: openaiApiKey })

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

/**
 * Obtener fecha en zona horaria Europe/Madrid
 * Retorna day, month, year para la fecha especificada (o hoy si no se especifica)
 */
function getDateInMadridTimezone(dateString = null) {
  let date
  if (dateString) {
    // Parsear YYYY-MM-DD como local (no UTC)
    date = new Date(dateString + 'T00:00:00')
  } else {
    date = new Date()
  }

  // Convertir a zona horaria Europe/Madrid
  const formatter = new Intl.DateTimeFormat('es-ES', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  
  const parts = formatter.formatToParts(date)
  const year = parseInt(parts.find(p => p.type === 'year').value)
  const month = parseInt(parts.find(p => p.type === 'month').value)
  const day = parseInt(parts.find(p => p.type === 'day').value)

  return { day, month, year, dateObj: date }
}

/**
 * Obtener "mañana" en zona horaria Europe/Madrid
 * Si TARGET_DATE está definido, parsear esa fecha.
 * Si no, calcular "mañana" desde hoy en Europe/Madrid.
 */
function getTomorrowMadridTimezone() {
  if (targetDateInput) {
    // Usar la fecha especificada
    console.log(`📍 Using TARGET_DATE from environment: ${targetDateInput}`)
    return getDateInMadridTimezone(targetDateInput)
  }

  // Calcular "mañana" en Europe/Madrid
  const todayInMadrid = getDateInMadridTimezone()
  const tomorrow = new Date(todayInMadrid.dateObj)
  tomorrow.setDate(tomorrow.getDate() + 1)

  return getDateInMadridTimezone(tomorrow.toISOString().split('T')[0])
}

/**
 * Obtener HOY en UTC (para mantener compatibilidad con getTodayEphemeris)
 */
function getTodayUTC() {
  const now = new Date()

  return {
    day: now.getUTCDate(),
    month: now.getUTCMonth() + 1,
    year: now.getUTCFullYear(),
    dateObj: now,
  }
}

/**
 * Obtener el nombre del mes en inglés
 */
function getMonthName(month) {
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ]
  return months[month - 1]
}

/**
 * Verificar si ya existe una efeméride para esa fecha
 */
async function ephemerisExists(day, month, year) {
  const { data, error } = await supabase
    .from('ephemerides')
    .select('id')
    .eq('day', day)
    .eq('month', month)
    .eq('year', year)
    .single()

  if (error && error.code === 'PGRST116') {
    // No row found - esto es lo que queremos
    return false
  }

  if (error) {
    throw new Error(`Error checking existence: ${error.message}`)
  }

  return !!data
}

/**
 * Generar efeméride usando OpenAI
 */
async function generateEphemerisWithAI(day, month, year, monthName) {
  const currentYear = new Date().getUTCFullYear()
  const validCategoriesStr = VALID_CATEGORIES.join(', ')
  
  const prompt = `Generate a HISTORICAL event (from a past year, NOT current year ${currentYear}) that occurred on ${monthName} ${day}.

The event should be:
- A real, verifiable historical event from technology, science, or computing
- From a PAST year (before ${currentYear}). Important: NOT from year ${currentYear}.
- Include the specific year it happened
- Include who discovered/founded/created it (person or organization)
- Include why it was important or its impact

IMPORTANT - Category MUST be ONE OF: ${validCategoriesStr}

Respond in JSON format ONLY (no markdown, no explanation):
{
  "title": "Event Title (5-10 words, include the year)",
  "description": "3-4 sentences with: (1) The event description, (2) Who was involved (person/organization), (3) Historical year (e.g., 'In 1997...'), (4) Why it mattered/impact. Maximum 300 characters.",
  "category": "TECH",
  "source_url": "A real, verifiable Wikipedia or historical URL for this event"
}

Requirements:
- The event MUST have occurred on ${monthName} ${day} of ANY PAST YEAR (not ${currentYear})
- The event MUST be verifiable and historically accurate
- The description MUST mention the year it happened
- The description MUST mention the person(s) or organization involved
- The description MUST explain why it was important
- The category MUST be one of: ${validCategoriesStr}
- Return ONLY valid JSON, nothing else.`

  console.log(`\n📝 Requesting AI to generate historical ephemeris for ${monthName} ${day}...`)

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.8,
  })

  const content = response.choices[0].message.content.trim()

  // Parse JSON
  let ephemeris
  try {
    ephemeris = JSON.parse(content)
  } catch (e) {
    throw new Error(`Failed to parse AI response: ${content}`)
  }

  // Validar estructura básica
  if (!ephemeris.title || !ephemeris.description || !ephemeris.category) {
    throw new Error(`Invalid ephemeris structure: ${JSON.stringify(ephemeris)}`)
  }

  // NUEVA LÓGICA: Normalizar y validar categoría con fallback seguro
  // No hace throw, solo log warning
  const normalizedCategory = normalizeCategoryWithFallback(ephemeris.category)
  ephemeris.category = normalizedCategory

  // Validar URL
  if (!ephemeris.source_url || !ephemeris.source_url.startsWith('http')) {
    throw new Error(`Invalid source_url: ${ephemeris.source_url}`)
  }

  return ephemeris
}

/**
 * Validar que la fecha en la efeméride coincide con la solicitada
 */
function validateDateInContent(content, day, month, year, monthName) {
  const fullContent = `${content.title} ${content.description}`.toLowerCase()

  // Buscar el día
  const dayMatches = fullContent.includes(day.toString())

  // Buscar el mes (por nombre)
  const monthMatches = fullContent.toLowerCase().includes(monthName.toLowerCase())

  // Solo requerimos día y mes. El año será histórico (no necesariamente el consultado)
  return dayMatches && monthMatches
}

/**
 * Normalizar y validar categoría con fallback seguro
 * - Trim y uppercase
 * - Mapear categorías conocidas no soportadas a equivalentes
 * - Fallback a SCIENCE si es totalmente inválida
 * - Log warnings pero NO throw
 */
function normalizeCategoryWithFallback(category) {
  const normalized = category.trim().toUpperCase()

  // Si ya es válida
  if (VALID_CATEGORIES.includes(normalized)) {
    return normalized
  }

  // Intentar mapeo semántico
  if (CATEGORY_MAPPING[normalized]) {
    const mapped = CATEGORY_MAPPING[normalized]
    console.warn(`⚠️  Category "${category}" not in whitelist, mapped to "${mapped}"`)
    return mapped
  }

  // Fallback final a SCIENCE
  console.warn(`⚠️  Category "${category}" not recognized, falling back to "SCIENCE"`)
  return 'SCIENCE'
}

/**
 * Insertar o actualizar efeméride en Supabase (upsert)
 * Si ya existe para esa fecha, actualizar; si no, insertar.
 */
async function insertOrUpdateEphemeris(day, month, year, data) {
  // Intentar upsert usando on_conflict
  const { error } = await supabase.from('ephemerides').upsert(
    [
      {
        day,
        month,
        year,
        title: data.title,
        description: data.description,
        category: data.category,
        display_date: `${getMonthName(month)} ${day}`,
        source_url: data.source_url,
      },
    ],
    {
      onConflict: 'day,month,year', // Unique constraint columns
    }
  )

  if (error) {
    throw new Error(`Failed to insert/update ephemeris: ${error.message}`)
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  try {
    console.log('🚀 Starting ephemeris generation...\n')

    // 1. Calcular la fecha objetivo (mañana en Spain tz, o TARGET_DATE si se proporciona)
    const { day, month, year, dateObj } = getTomorrowMadridTimezone()
    const monthName = getMonthName(month)
    console.log(`📅 Target date: ${monthName} ${day}, ${year}`)
    if (targetDateInput) {
      console.log(`   (using TARGET_DATE environment variable)`)
    } else {
      console.log(`   (calculated as tomorrow in Europe/Madrid timezone)`)
    }

    // 2. Verificar que no existe
    console.log('🔍 Checking if ephemeris already exists...')
    const exists = await ephemerisExists(day, month, year)

    if (exists) {
      console.log(`⚠️  Ephemeris for ${monthName} ${day}, ${year} already exists. Skipping.`)
      process.exit(0)
    }

    console.log(`✓ No existing ephemeris found. Proceeding with generation.`)

    // 3. Generar con IA
    const generatedEphemeris = await generateEphemerisWithAI(day, month, year, monthName)
    console.log(`\n✓ Generated ephemeris:`)
    console.log(`  Title: ${generatedEphemeris.title}`)
    console.log(`  Category: ${generatedEphemeris.category}`)
    console.log(`  Description: ${generatedEphemeris.description.substring(0, 100)}...`)

    // 4. Validar que la fecha coincide
    console.log(`\n🔐 Validating date consistency...`)
    const dateValid = validateDateInContent(generatedEphemeris, day, month, year, monthName)

    if (!dateValid) {
      throw new Error(
        `⚠️  Date validation failed! The AI response doesn't contain the correct date. ` +
          `Expected: ${monthName} ${day}, ${year}\n` +
          `Content: ${generatedEphemeris.title} - ${generatedEphemeris.description}`
      )
    }

    console.log(`✓ Date validation passed!`)

    // 5. Insertar o actualizar
    console.log(`\n💾 Inserting/updating in Supabase...`)
    await insertOrUpdateEphemeris(day, month, year, generatedEphemeris)

    console.log(`✅ SUCCESS! Ephemeris for ${monthName} ${day}, ${year} has been created/updated:`)
    console.log(`   Title: ${generatedEphemeris.title}`)
    console.log(`   Category: ${generatedEphemeris.category}`)
    console.log(`   Source: ${generatedEphemeris.source_url}`)

    process.exit(0)
  } catch (error) {
    console.error(`\n❌ ERROR: ${error.message}`)
    console.error('\nStack:', error.stack)
    process.exit(1)
  }
}

main()
