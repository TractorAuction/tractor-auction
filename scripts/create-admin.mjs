#!/usr/bin/env node
/**
 * Creates (or promotes) an admin account.
 *
 *   npm run create-admin                        # demo account, generated password
 *   npm run create-admin -- you@example.com     # promote or create this address
 *   npm run create-admin -- you@example.com 'my-password'
 *
 * Uses the service role, so it runs only from your machine and never from the
 * app. The account is created with its email pre-confirmed, which is what makes
 * the demo account usable immediately without an inbox round trip.
 */

import { readFileSync } from "node:fs"
import { randomBytes } from "node:crypto"
import { createClient } from "@supabase/supabase-js"

function loadEnv(path = ".env.local") {
  try {
    for (const line of readFileSync(path, "utf8").split("\n")) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/)
      if (!match) continue
      const value = match[2].trim().replace(/^["']|["']$/g, "")
      if (!process.env[match[1]]) process.env[match[1]] = value
    }
  } catch {
    // Fall through to whatever is already in the environment.
  }
}

loadEnv()

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

function fail(message) {
  console.error(`\n✗ ${message}\n`)
  process.exit(1)
}

if (!url || url.startsWith("your_")) {
  fail("NEXT_PUBLIC_SUPABASE_URL is not set in .env.local")
}
if (!serviceRoleKey || serviceRoleKey.startsWith("your_")) {
  fail(
    "SUPABASE_SERVICE_ROLE_KEY is not set in .env.local.\n" +
      "  Supabase dashboard → Settings → API → service_role"
  )
}

const email = process.argv[2] ?? "admin@tractorauction.local"
const password = process.argv[3] ?? `ta-${randomBytes(9).toString("base64url")}`
const generated = process.argv[3] === undefined

const supabase = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

async function findUserByEmail(address) {
  // listUsers is paginated and has no email filter, so page until found.
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 })
    if (error) fail(`Could not list users: ${error.message}`)
    const match = data.users.find(
      (user) => user.email?.toLowerCase() === address.toLowerCase()
    )
    if (match) return match
    if (data.users.length < 200) return null
  }
  return null
}

const existing = await findUserByEmail(email)
let userId
let createdNow = false

if (existing) {
  userId = existing.id
  if (!generated) {
    const { error } = await supabase.auth.admin.updateUserById(userId, { password })
    if (error) fail(`Could not update the password: ${error.message}`)
  }
} else {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: "Demo Admin" },
  })
  if (error) fail(`Could not create the user: ${error.message}`)
  userId = data.user.id
  createdNow = true
}

// The handle_new_user trigger creates the profile; upsert covers a database
// where 0004 has not been run yet.
const { error: profileError } = await supabase
  .from("profiles")
  .upsert({ id: userId, email, role: "admin" }, { onConflict: "id" })

if (profileError) {
  fail(
    `User is ready but the profile could not be set to admin: ${profileError.message}\n` +
      "  Has supabase/migrations/0004_auth.sql been run?"
  )
}

console.log(`
✓ Admin ready

  Email:    ${email}
  Password: ${createdNow || !generated ? password : "(unchanged — existing account)"}
  Role:     admin

  Log in at /login, then open /admin.
`)

if (generated && createdNow) {
  console.log("  Save that password now — it is not stored anywhere else.\n")
}
