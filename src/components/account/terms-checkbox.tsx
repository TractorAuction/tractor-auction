import Link from "next/link"

/**
 * Affirmative acceptance of the Terms ("clickwrap"): the owner's Terms are
 * accepted "through a checkbox, registration process, or other legally
 * sufficient electronic acceptance mechanism", so the box is required and
 * unticked by default. The server action re-checks it.
 */
export function TermsCheckbox() {
  return (
    <label className="flex items-start gap-2.5 text-sm text-muted-foreground">
      <input type="checkbox" name="accept_terms" required className="mt-0.5 size-4 shrink-0" />
      <span>
        I have read and agree to the{" "}
        <Link href="/terms" target="_blank" className="font-medium text-primary hover:underline">
          Terms and Conditions
        </Link>
        , including the release of liability, and the{" "}
        <Link href="/privacy" target="_blank" className="font-medium text-primary hover:underline">
          Privacy Policy
        </Link>
        .
      </span>
    </label>
  )
}
