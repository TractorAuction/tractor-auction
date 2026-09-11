import { createClient as createSupabaseClient } from "@supabase/supabase-js"

import { supabaseAnonKey, supabaseUrl } from "./env"

/**
 * Anon client with no cookie access, for public data that is the same for every
 * visitor (the sitemap, and any other cacheable route).
 *
 * The cookie-based server client makes a route dynamic just by reading cookies,
 * which would force the sitemap to hit the database on every crawler request.
 * This one carries no session, so RLS applies as the anonymous role.
 */
export function createPublicClient() {
  return createSupabaseClient(supabaseUrl(), supabaseAnonKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
