import { ArrowLeft } from "lucide-react"
import Link from "next/link"

import { OutreachBatch } from "@/components/admin/outreach-batch"
import { getOutreachContacts } from "@/lib/admin/queries"
import { isFollowUpDue } from "@/lib/outreach/pipeline"
import { OUTREACH_STAGES } from "@/lib/outreach/templates"

/** Which contacts each email type is for. Anything else isn't offered in a batch. */
const ELIGIBLE: Record<string, readonly string[]> = {
  first_contact: ["pending"],
  follow_up: ["contacted", "follow_up"],
  api_request: ["responded"],
  integration_followup: ["api_requested", "integration_pending"],
}

export default async function OutreachBatchPage(props: PageProps<"/admin/outreach/batch">) {
  const params = await props.searchParams
  const raw = Array.isArray(params.type) ? params.type[0] : params.type
  const stageId = raw && raw in ELIGIBLE ? raw : "first_contact"

  const now = new Date()
  const contacts = (await getOutreachContacts())
    .filter((contact) => contact.contact_email && ELIGIBLE[stageId].includes(contact.status))
    // Follow-ups only make sense once the reminder date has come round.
    .filter((contact) => stageId !== "follow_up" || isFollowUpDue(contact, now))

  return (
    <>
      <div className="flex flex-col gap-2">
        <Link
          href="/admin/outreach"
          className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to Outreach
        </Link>
        <h1 className="text-2xl font-semibold text-foreground">Batch email</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Pick companies, write all the drafts at once, read and edit each one, then send the
          ones you approve with a single confirmation. Each sent company is marked as contacted
          with a follow-up reminder in 7 days.
        </p>
      </div>

      <nav aria-label="Email type" className="flex flex-wrap gap-1.5">
        {OUTREACH_STAGES.map((stage) => (
          <Link
            key={stage.id}
            href={`/admin/outreach/batch?type=${stage.id}`}
            aria-current={stage.id === stageId ? "page" : undefined}
            className={
              stage.id === stageId
                ? "rounded-full border border-primary bg-primary px-3 py-1 text-xs font-medium text-primary-foreground"
                : "rounded-full border border-border bg-background px-3 py-1 text-xs font-medium hover:bg-muted"
            }
          >
            {stage.name}
          </Link>
        ))}
      </nav>

      {/* Keyed on the type so switching resets the selection and drafts. */}
      <OutreachBatch key={stageId} stageId={stageId} contacts={contacts} />
    </>
  )
}
