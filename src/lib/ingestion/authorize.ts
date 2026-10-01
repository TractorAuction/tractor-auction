import crypto from "node:crypto"

/**
 * Shared gate for the ingestion endpoints.
 *
 * Vercel Cron sends `Authorization: Bearer $CRON_SECRET` on every scheduled
 * invocation once CRON_SECRET is set, so the bearer token is the only check —
 * and deliberately the only one. Trusting an `x-vercel-cron-*` header instead
 * would accept any caller willing to set it.
 *
 * These are operator endpoints, not UI: the admin pages gate on a signed-in
 * admin profile via requireAdmin() instead.
 */
export function requireIngestSecret(request: Request):
  | { ok: true }
  | { ok: false; status: number; error: string } {
  const secret = process.env.CRON_SECRET

  if (!secret) {
    return {
      ok: false,
      status: 503,
      error: "CRON_SECRET is not configured; refusing to run ingestion",
    }
  }

  const header = request.headers.get("authorization")
  if (!header || !timingSafeEqual(header, `Bearer ${secret}`)) {
    return { ok: false, status: 401, error: "Unauthorized" }
  }

  return { ok: true }
}

/** Compares without leaking length or position through early return. */
function timingSafeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  if (left.length !== right.length) return false
  return crypto.timingSafeEqual(left, right)
}
