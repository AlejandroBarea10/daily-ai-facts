#!/usr/bin/env node

/**
 * Script para generar automáticamente una efeméride para mañana (UTC)
 * 
 * Requisitos:
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 * - OPENAI_API_KEY
 * 
 * Uso: node scripts/generate-ephemeris.js
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
// CONFIGURACIÓN
// ============================================================================

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const openaiApiKey = process.env.OPENAI_API_KEY

// Validar variables de entorno
if (!supabaseUrl || !supabaseServiceKey || !openaiApiKey) {
  console.error('❌ Error: Variables de entorno faltantes')
  console.error('Requeridas:')
  console.error('  - SUPABASE_URL')
  console.error('  - SUPABASE_SERVICE_ROLE_KEY')
  console.error('  - OPENAI_API_KEY')
  process.exit(1)
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
 * Obtener mañana en UTC
 */
function getTomorrowUTC() {
  const now = new Date()
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)

  return {
    day: tomorrow.getUTCDate(),
    month: tomorrow.getUTCMonth() + 1,
    year: tomorrow.getUTCFullYear(),
    dateObj: tomorrow,
  }
}

/**
 * Obtener HOY en UTC
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
  
  const prompt = `Generate a HISTORICAL event (from a past year, NOT current year ${currentYear}) that occurred on ${monthName} ${day}.

The event should be:
- A real, verifiable historical event from technology, science, or computing
- From a PAST year (before ${currentYear}). Important: NOT from year ${currentYear}.
- Include the specific year it happened
- Include who discovered/founded/created it (person or organization)
- Include why it was important or its impact

Respond in JSON format ONLY (no markdown, no explanation):
{
  "title": "Event Title (5-10 words, include the year)",
  "description": "3-4 sentences with: (1) The event description, (2) Who was involved (person/organization), (3) Historical year (e.g., 'In 1997...'), (4) Why it mattered/impact. Maximum 300 characters.",
  "category": "TECH or AI or COMPUTING",
  "source_url": "A real, verifiable Wikipedia or historical URL for this event"
}

IMPORTANT:
- The event MUST have occurred on ${monthName} ${day} of ANY PAST YEAR (not ${currentYear})
- The event MUST be verifiable and historically accurate
- The description MUST mention the year it happened
- The description MUST mention the person(s) or organization involved
- The description MUST explain why it was important
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

  // Validar estructura
  if (!ephemeris.title || !ephemeris.description || !ephemeris.category) {
    throw new Error(`Invalid ephemeris structure: ${JSON.stringify(ephemeris)}`)
  }

  // Validar categoría
  if (!['AI', 'TECH', 'COMPUTING'].includes(ephemeris.category)) {
    throw new Error(`Invalid category: ${ephemeris.category}`)
  }

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
 * Insertar efeméride en Supabase
 */
async function insertEphemeris(day, month, year, data) {
  const { error } = await supabase.from('ephemerides').insert([
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
  ])

  if (error) {
    throw new Error(`Failed to insert ephemeris: ${error.message}`)
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  try {
    console.log('🚀 Starting ephemeris generation...\n')

    // 1. Calcular mañana
    const { day, month, year, dateObj } = getTomorrowUTC()
    const monthName = getMonthName(month)
    console.log(`📅 Target date: ${monthName} ${day}, ${year}`)

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

    // 5. Insertar
    console.log(`\n💾 Inserting into Supabase...`)
    await insertEphemeris(day, month, year, generatedEphemeris)

    console.log(`✅ SUCCESS! Ephemeris for ${monthName} ${day}, ${year} has been created:`)
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
