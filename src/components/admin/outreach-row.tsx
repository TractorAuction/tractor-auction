"use client"

import { AlertCircle, ChevronDown, ExternalLink, Mail, Pencil } from "lucide-react"
import { useState } from "react"

import { updateOutreachContact } from "@/app/admin/actions"
import { Badge } from "@/components/admin/data-table"
import { OutreachComposer } from "@/components/admin/outreach-composer"
import { Button } from "@/components/ui/button"
import { STATUSES, STATUS_META, nextStep } from "@/lib/outreach/pipeline"
import { cn } from "@/lib/utils"
import type { OutreachContact } from "@/types"

const inputClass =
  "h-9 w-full rounded-lg border border-border bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

function shortDate(value?: string) {
  if (!value) return null
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

/**
 * One company: a scannable summary line with the next step and the two things
 * you do here (email them, edit their details). Both open in place, full width,
 * so nothing is squeezed into a table cell.
 */
export function OutreachRow({ contact }: { contact: OutreachContact }) {
  const [panel, setPanel] = useState<"email" | "edit" | null>(null)
  const status = STATUS_META[contact.status]
  const step = nextStep(contact)
  // Only a company we still have to contact is blocked on an address. GSA-style
  // rows (feed already received) shouldn't push "Add email" as the next action.
  const needsEmail = !contact.contact_email && contact.status === "pending"

  function toggle(next: "email" | "edit") {
    setPanel((current) => (current === next ? null : next))
  }

  return (
    <li className="flex flex-col gap-3 px-4 py-3.5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
        {/* Who */}
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-foreground">{contact.company_name}</span>
            <Badge tone={status.tone}>{status.label}</Badge>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
            {contact.website_url && (
              <a
                href={contact.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 hover:text-primary hover:underline"
              >
                {contact.website_url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
                <ExternalLink className="size-3" />
              </a>
            )}
            {contact.contact_email ? (
              <span className="inline-flex items-center gap-1">
                <Mail className="size-3" />
                {contact.contact_name ? `${contact.contact_name} · ` : ""}
                {contact.contact_email}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400">
                <AlertCircle className="size-3" />
                No contact email
              </span>
            )}
            {contact.integration_request && <span>Ask: {contact.integration_request}</span>}
          </div>
        </div>

        {/* What next */}
        <div className="flex flex-col gap-0.5 text-xs md:w-48 md:shrink-0">
          <span
            className={cn(
              "font-medium",
              step.urgent ? "text-amber-700 dark:text-amber-400" : "text-foreground"
            )}
          >
            {step.text}
          </span>
          <span className="text-muted-foreground">
            {contact.outreach_date ? `Emailed ${shortDate(contact.outreach_date)}` : "Never emailed"}
            {contact.follow_up_date ? ` · follow up ${shortDate(contact.follow_up_date)}` : ""}
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-2 md:shrink-0">
          {needsEmail ? (
            <Button size="sm" onClick={() => toggle("edit")} aria-expanded={panel === "edit"}>
              <Pencil />
              Add email
            </Button>
          ) : (
            <Button
              size="sm"
              variant={panel === "email" ? "secondary" : "default"}
              onClick={() => toggle("email")}
              aria-expanded={panel === "email"}
            >
              <Mail />
              Email
            </Button>
          )}
          {!(needsEmail && panel === "edit") && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => toggle("edit")}
              aria-expanded={panel === "edit"}
            >
              Details
              <ChevronDown className={cn("transition-transform", panel === "edit" && "rotate-180")} />
            </Button>
          )}
        </div>
      </div>

      {panel === "email" && <OutreachComposer contact={contact} onClose={() => setPanel(null)} />}

      {panel === "edit" && (
        <form
          action={async (formData) => {
            await updateOutreachContact(formData)
            setPanel(null)
          }}
          className="grid gap-3 rounded-lg border border-border bg-muted/30 p-3 sm:grid-cols-2 sm:p-4"
        >
          <input type="hidden" name="id" value={contact.id} />
          <input type="hidden" name="previous_status" value={contact.status} />

          <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
            Status
            <select name="status" defaultValue={contact.status} className={inputClass}>
              {STATUSES.map((option) => (
                <option key={option} value={option}>
                  {STATUS_META[option].label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
            Follow-up date
            <input
              name="follow_up_date"
              type="date"
              defaultValue={contact.follow_up_date?.slice(0, 10) ?? ""}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
            Contact name
            <input
              name="contact_name"
              defaultValue={contact.contact_name ?? ""}
              placeholder="e.g. Jane Smith"
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
            Contact email
            <input
              name="contact_email"
              type="email"
              defaultValue={contact.contact_email ?? ""}
              placeholder="From the company's own contact page"
              className={inputClass}
              autoFocus={needsEmail}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
            Phone
            <input
              name="contact_phone"
              defaultValue={contact.contact_phone ?? ""}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
            What to ask for
            <input
              name="integration_request"
              defaultValue={contact.integration_request ?? ""}
              placeholder="e.g. API or XML feed"
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground sm:col-span-2">
            Notes
            <textarea
              name="notes"
              defaultValue={contact.notes ?? ""}
              rows={4}
              placeholder="What they said, who to ask next, anything worth remembering"
              className="w-full rounded-lg border border-border bg-background px-2.5 py-2 text-sm leading-relaxed outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </label>
          {/* Fields the form doesn't show are passed through unchanged. */}
          <input type="hidden" name="existing_api_info" value={contact.existing_api_info ?? ""} />
          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit" size="sm">
              Save changes
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setPanel(null)}>
              Cancel
            </Button>
          </div>
        </form>
      )}
    </li>
  )
}
