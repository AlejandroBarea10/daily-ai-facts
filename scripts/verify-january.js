#!/usr/bin/env node

import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const envPath = join(__dirname, '..', '.env.local')
dotenv.config({ path: envPath })

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Variables de entorno faltantes')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function main() {
  try {
    console.log('\n📅 VERIFICANDO EFEMÉRIDES DE ENERO 2026...\n')

    const { data, error } = await supabase
      .from('ephemerides')
      .select('day, month, year, title, category, id, created_at')
      .eq('year', 2026)
      .eq('month', 1)
      .order('year', { ascending: true })
      .order('month', { ascending: true })
      .order('day', { ascending: true })

    if (error) {
      throw new Error(`Error en query: ${error.message}`)
    }

    console.log('DÍA | CATEGORÍA | TÍTULO')
    console.log('----+----------+---------------------------------------------')

    const dias = new Set()
    data.forEach(row => {
      const dayStr = String(row.day).padStart(2, '0')
      const catStr = row.category.padEnd(8)
      const titleStr = row.title.substring(0, 40)
      console.log(`${dayStr}  | ${catStr} | ${titleStr}`)
      dias.add(row.day)
    })

    console.log('\n✓ Días registrados:', Array.from(dias).sort((a, b) => a - b).join(', '))
    console.log(`✓ Total de efemérides: ${data.length}`)

    // Verificar huecos
    const huecos = []
    for (let i = 1; i <= 31; i++) {
      if (!dias.has(i)) {
        huecos.push(i)
      }
    }

    console.log('')
    if (huecos.length === 0) {
      console.log('✅ NO HAY HUECOS - Enero 2026 está completo (31/31 días)')
    } else {
      console.log(`⚠️  Huecos detectados: ${huecos.join(', ')} (${31 - data.length} días faltantes)`)
    }

    process.exit(0)
  } catch (error) {
    console.error(`\n❌ ERROR: ${error.message}`)
    process.exit(1)
  }
}

main()
