import { supabase } from './supabase'

/**
 * Dev-only connectivity check. A logged-out caller sees no rows (RLS denies
 * anon) — that is expected; we only assert there is no transport/config error.
 */
export async function smokeTestSupabase(): Promise<void> {
  const { error } = await supabase.from('countries').select('id').limit(1)
  if (error) {
    console.error('[supabase] smoke test failed:', error.message)
  } else {
    console.info('[supabase] smoke test OK — client reached the database')
  }
}
