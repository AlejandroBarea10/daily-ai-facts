#!/usr/bin/env node

/**
 * Script de backfill - Regenera efemérides para múltiples fechas
 * 
 * Uso:
 *   node scripts/backfill-dates.js 2026-01-14               # Una fecha
 *   node scripts/backfill-dates.js 2026-01-14 2026-01-15    # Múltiples
 *   node scripts/backfill-dates.js 2026-01-{11..15}         # Rango (bash)
 * 
 * Requiere: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY en .env.local
 */

import { spawn } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function runGenerate(targetDate) {
  return new Promise((resolve, reject) => {
    const child = spawn('node', ['generate-ephemeris.js'], {
      cwd: __dirname,
      env: {
        ...process.env,
        TARGET_DATE: targetDate,
      },
      stdio: 'inherit',
    })

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Generation failed for ${targetDate} with exit code ${code}`))
      } else {
        resolve()
      }
    })
  })
}

async function main() {
  const dates = process.argv.slice(2)

  if (dates.length === 0) {
    console.error('❌ Error: Debes proporcionar al menos una fecha')
    console.error('')
    console.error('Uso:')
    console.error('  node scripts/backfill-dates.js 2026-01-14')
    console.error('  node scripts/backfill-dates.js 2026-01-14 2026-01-15 2026-01-16')
    console.error('')
    console.error('Formato: YYYY-MM-DD')
    process.exit(1)
  }

  console.log(`\n🔄 Backfill iniciado para ${dates.length} fecha(s)...\n`)

  let successful = 0
  let failed = 0
  const errors = []

  for (const date of dates) {
    try {
      console.log(`\n📅 Regenerando ${date}...`)
      await runGenerate(date)
      successful++
      console.log(`✅ ${date} completado`)
    } catch (error) {
      failed++
      const errorMsg = error instanceof Error ? error.message : String(error)
      errors.push({ date, error: errorMsg })
      console.error(`❌ ${date} falló`)
    }

    // Pequeña pausa entre solicitudes
    if (dates.indexOf(date) < dates.length - 1) {
      console.log('⏳ Esperando 2 segundos antes de la siguiente...')
      await new Promise((resolve) => setTimeout(resolve, 2000))
    }
  }

  console.log(`\n${'='.repeat(60)}`)
  console.log(`📊 Resumen del Backfill`)
  console.log(`${'='.repeat(60)}`)
  console.log(`✅ Exitosas: ${successful}/${dates.length}`)
  console.log(`❌ Fallidas: ${failed}/${dates.length}`)

  if (errors.length > 0) {
    console.log(`\n⚠️  Errores:`)
    errors.forEach(({ date, error }) => {
      console.log(`  - ${date}: ${error}`)
    })
  }

  process.exit(failed > 0 ? 1 : 0)
}

main()
