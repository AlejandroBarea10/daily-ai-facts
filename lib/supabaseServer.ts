import { createClient } from '@supabase/supabase-js'
import { fetch as undiciFetch } from 'undici'

// Server-side only client
// These env vars are NOT exposed to the frontend
const supabaseUrl = process.env.SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

// Diagnostic logs (server-side only)
if (process.env.NODE_ENV !== 'production') {
  console.log('[Supabase] Initializing server-side client...')
  console.log('[Supabase] URL:', supabaseUrl ? '✓ Present' : '✗ Missing')
  console.log('[Supabase] Key:', supabaseAnonKey ? '✓ Present' : '✗ Missing')
}

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables. Check your .env.local file.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: undiciFetch,
  },
})

if (process.env.NODE_ENV !== 'production') {
  console.log('[Supabase] Client initialized successfully')
}

/**
 * Get today's date in UTC format (day, month, year)
 */
export function getTodayUTC() {
  const now = new Date()
  const utcYear = now.getUTCFullYear()
  const utcMonth = now.getUTCMonth() + 1 // getUTCMonth returns 0-11
  const utcDay = now.getUTCDate()

  if (process.env.NODE_ENV !== 'production') {
    console.log('[Supabase] Current Date Info:')
    console.log('  Local Date:', now.toLocaleString())
    console.log('  UTC Date:', now.toUTCString())
    console.log('  UTC Calculation:', { utcDay, utcMonth, utcYear })
  }

  return { day: utcDay, month: utcMonth, year: utcYear }
}

/**
 * Fetch ephemeris for today from Supabase
 * If not found, fallback to the most recent ephemeris available
 */
export async function getTodayEphemeris() {
  try {
    const { day, month, year } = getTodayUTC()
    
    console.log('[Supabase] Querying ephemerides for today:', { day, month, year })

    // Query for today's ephemeris using maybeSingle() instead of single()
    // maybeSingle() returns null if 0 rows, not an error
    const { data: todayData, error: todayError } = await supabase
      .from('ephemerides')
      .select('*')
      .eq('day', day)
      .eq('month', month)
      .eq('year', year)
      .maybeSingle()

    if (todayError) {
      console.error('[Supabase] Error querying today:', {
        code: todayError.code || '(no code)',
        message: todayError.message || '(no message)',
      })
      // Continue to fallback
    }

    if (todayData) {
      console.log('[Supabase] Found ephemeris for today:', {
        title: todayData.title,
        date: `${todayData.day}/${todayData.month}/${todayData.year}`,
      })
      return todayData
    }

    // Fallback: Get the most recent ephemeris available
    console.log('[Supabase] No ephemeris found for today. Fetching most recent...')
    
    const { data: latestData, error: latestError } = await supabase
      .from('ephemerides')
      .select('*')
      .order('year', { ascending: false })
      .order('month', { ascending: false })
      .order('day', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (latestError) {
      console.error('[Supabase] Error fetching latest ephemeris:', {
        code: latestError.code || '(no code)',
        message: latestError.message || '(no message)',
      })
      return null
    }

    if (latestData) {
      console.log('[Supabase] Returning most recent ephemeris:', {
        title: latestData.title,
        date: `${latestData.day}/${latestData.month}/${latestData.year}`,
        note: 'This is not today\'s ephemeris, but the most recent available',
      })
      return latestData
    }

    console.log('[Supabase] No ephemeris data available in database')
    return null
  } catch (error) {
    console.error('[Supabase] Fatal error during query:', {
      message: error instanceof Error ? error.message : String(error),
      name: error instanceof Error ? error.name : 'Unknown',
    })
    return null
  }
}
