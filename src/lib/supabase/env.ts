/**
 * Supabase credentials are read through here so a missing or still-placeholder
 * .env.local fails with an actionable message rather than a DNS lookup error
 * halfway through rendering a page.
 */
function required(name: string, value: string | undefined): string {
  if (!value || value.startsWith("your_")) {
    throw new Error(
      `${name} is not configured. Copy the project URL and keys from the Supabase ` +
        `dashboard (Settings → API) into .env.local, then restart the dev server.`
    )
  }
  return value
}

export function supabaseUrl() {
  return required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL)
}

export function supabaseAnonKey() {
  return required("NEXT_PUBLIC_SUPABASE_ANON_KEY", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}
