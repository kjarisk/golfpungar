import { createClient } from '@supabase/supabase-js'

import type { Database } from './supabase-types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing Supabase config — set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local'
  )
}

/**
 * Typed Supabase client. Server-backed data flows through TanStack Query
 * hooks built on top of this client (see Phases 24+).
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseKey)
