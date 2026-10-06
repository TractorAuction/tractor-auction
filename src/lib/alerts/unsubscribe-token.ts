import crypto from "node:crypto"

/**
 * One-click unsubscribe has to work with no login — the visitor is reading
 * email, not signed into a browser session — so the link itself has to prove
 * who it's for. An HMAC-signed token does that without a database lookup:
 * anyone holding the server secret can verify a token wasn't forged, and
 * nothing about it is reversible without that secret.
 */
function secret(): string {
  const value = process.env.ALERTS_UNSUBSCRIBE_SECRET
  if (!value || value.startsWith("your_")) {
    throw new Error(
      "ALERTS_UNSUBSCRIBE_SECRET is not configured. Add it to .env.local to send alert emails."
    )
  }
  return value
}

export function signUnsubscribeToken(userId: string): string {
  const signature = crypto.createHmac("sha256", secret()).update(userId).digest("base64url")
  return `${userId}.${signature}`
}

/** Returns the user id the token is valid for, or null if it's malformed,
 *  forged, or signed with a secret that's since been rotated. */
export function verifyUnsubscribeToken(token: string): string | null {
  const [userId, signature] = token.split(".")
  if (!userId || !signature) return null

  const expected = crypto.createHmac("sha256", secret()).update(userId).digest("base64url")

  const a = Buffer.from(signature)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null

  return userId
}
