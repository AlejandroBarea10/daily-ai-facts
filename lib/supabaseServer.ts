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
 */
export async function getTodayEphemeris() {
  try {
    const { day, month, year } = getTodayUTC()
    
    console.log('[Supabase] Querying ephemerides for:', { day, month, year })

    const { data, error } = await supabase
      .from('ephemerides')
      .select('*')
      .eq('day', day)
      .eq('month', month)
      .eq('year', year)
      .single() // Expect only one result

    if (error) {
      console.error('[Supabase] Query error object:', JSON.stringify(error, null, 2))
      console.error('[Supabase] Error details:', {
        code: error.code || '(no code)',
        message: error.message || '(no message)',
        status: (error as any).status || '(no status)',
        hint: (error as any).hint || '(no hint)',
      })
      
      if (error.code === 'PGRST116') {
        // No row found - this is expected
        console.log('[Supabase] No ephemeris found for this date (expected)')
        return null
      }
      
      // All other errors - return null and let frontend show "no data"
      console.error('[Supabase] Returning null due to error')
      return null
    }

    if (!data) {
      console.log('[Supabase] Query successful but no data returned')
      return null
    }

    console.log('[Supabase] Query successful, data returned:', {
      title: data.title,
      date: `${data.day}/${data.month}`,
    })
    
    return data
  } catch (error) {
    console.error('[Supabase] Fatal error during query:', {
      message: error instanceof Error ? error.message : String(error),
      name: error instanceof Error ? error.name : 'Unknown',
      stack: error instanceof Error ? error.stack : undefined,
    })
    return null
  }
}
