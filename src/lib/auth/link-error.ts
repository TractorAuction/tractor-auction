/**
 * Wording for an email link Supabase rejected. Used by /callback (errors in the
 * query string) and /callback/complete (errors in the URL fragment).
 */
export function linkErrorMessage(code: string | null, description: string | null) {
  if (code === "otp_expired" || /expired|invalid/i.test(description ?? "")) {
    return "That link has expired or was already used. If you already confirmed your email, just log in. Otherwise sign up again or use Forgot password to get a new link."
  }
  return `${(description ?? "That link did not work").replace(/\+/g, " ").replace(/\.?$/, ".")} Request a new link and try again.`
}
