import { createClient as createSupabaseClient } from "@supabase/supabase-js"

import { supabaseUrl } from "./env"

/**
 * Service-role client. Bypasses RLS, so it must only ever be constructed in
 * server code behind an admin check — never imported into a client component.
 *
 * Staff-only tables (outreach_contacts, the partner queue, click analytics)
 * have RLS enabled with no public policy, so this is the only way to read them.
 */
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceRoleKey || serviceRoleKey.startsWith("your_")) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not configured. Copy it from the Supabase " +
        "dashboard (Settings → API → service_role) into .env.local. Keep it server-side only."
    )
  }

  return createSupabaseClient(supabaseUrl(), serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
