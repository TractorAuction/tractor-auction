import { checkBotId } from "botid/server"

/**
 * Bot screening for public forms that create something (an account, a
 * partner application). Since Oct 2026 scripts have been posting /register
 * and /partner/register with random-letter names and real people's email
 * addresses, which makes us send unsolicited confirmation mail from our own
 * domain. Each check below matches something those submissions did.
 *
 * Callers should treat a hit as a silent success: show the normal "done"
 * page so the script learns nothing, but create nothing and send nothing.
 */

/** Nobody fills in a sign-up or application form this fast. */
const MIN_FILL_MS = 3000
/** A form stamp older than this is replayed, not a person on the page. */
const MAX_FILL_MS = 1000 * 60 * 60 * 6

/** Field names the honeypot inputs use. Never give a real field these names. */
export const HONEYPOT_FIELDS = ["website", "company_website"] as const
export const FORM_STARTED_FIELD = "form_started"

function value(formData: FormData, name: string) {
  const raw = formData.get(name)
  return typeof raw === "string" ? raw.trim() : ""
}

/**
 * Random-letter strings like "kWTzsTIJkyEaTiDCovSHTB": one long run of
 * letters with capitals scattered through it. Real names ("McDonald",
 * "DeWitt", "John Deere") have at most a couple of inner capitals per word.
 */
export function looksRandom(text: string) {
  return text.split(/\s+/).some((word) => {
    if (word.length < 10 || !/^[A-Za-z]+$/.test(word)) return false
    const innerCaps = word.slice(1).replace(/[^A-Z]/g, "").length
    const lower = word.replace(/[^a-z]/g, "").length
    return innerCaps >= 4 && lower >= 4
  })
}

/**
 * Gmail ignores dots, so "s.cott..a.n.dr.e.ws" reaches the same inbox as
 * "scottandrews". Lists of real addresses get dotted like this to slip past
 * duplicate checks. Real people rarely use more than two dots, and Gmail
 * itself does not allow consecutive ones.
 */
export function looksDotPadded(email: string) {
  const [local, domain] = email.toLowerCase().split("@")
  if (!local || !domain) return false
  if (domain !== "gmail.com" && domain !== "googlemail.com") return false
  return local.includes("..") || (local.match(/\./g)?.length ?? 0) >= 3
}

export type GuardResult = { ok: true } | { ok: false; reason: string }

/**
 * Runs every check. `textFields` are the free-text fields to test for random
 * strings (names, company details); `email` is the address an account or
 * confirmation would go to.
 */
export async function screenSubmission(
  formData: FormData,
  { form, email, textFields }: { form: string; email: string; textFields: string[] }
): Promise<GuardResult> {
  const fail = (reason: string): GuardResult => {
    // The address is personal data and usually not the submitter's own, so
    // log only the domain.
    console.warn(`[form-guard] ${form} blocked: ${reason} (${email.split("@")[1] ?? "no email"})`)
    return { ok: false, reason }
  }

  if (HONEYPOT_FIELDS.some((name) => value(formData, name))) return fail("honeypot")

  const started = Number(value(formData, FORM_STARTED_FIELD))
  const elapsed = Date.now() - started
  if (!Number.isFinite(started) || started <= 0) return fail("no form stamp")
  if (elapsed < MIN_FILL_MS) return fail("too fast")
  if (elapsed > MAX_FILL_MS) return fail("stale form stamp")

  if (looksDotPadded(email)) return fail("dot-padded gmail")
  if (textFields.some((name) => looksRandom(value(formData, name)))) return fail("random text")

  // Vercel BotID: an invisible browser challenge. Outside Vercel (local dev)
  // it reports every request as human, so it never blocks development.
  try {
    const verdict = await checkBotId()
    if (verdict.isBot) return fail("botid")
  } catch (error) {
    // Fail open: a BotID outage must not stop real people signing up. The
    // other checks above still apply.
    console.error("[form-guard] BotID check failed:", error)
  }

  return { ok: true }
}
