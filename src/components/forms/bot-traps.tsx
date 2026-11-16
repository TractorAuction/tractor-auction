import { FORM_STARTED_FIELD } from "@/lib/security/form-guard"

/** Server time the form was rendered, checked by the time trap. */
function formShownAt() {
  return Date.now()
}

/**
 * Hidden spam traps checked by screenSubmission() in lib/security/form-guard.
 * Render inside any public <form> whose action calls it. The page must be
 * dynamic (it reads searchParams), or the time stamp would be the build time.
 *
 * The honeypot sits off screen rather than display:none, because many bots
 * skip fields hidden that way.
 */
export function BotTraps() {
  return (
    <>
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Website
          <input name="website" type="text" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <input type="hidden" name={FORM_STARTED_FIELD} value={formShownAt()} />
    </>
  )
}
