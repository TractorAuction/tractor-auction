import type { OutreachContact } from "@/types"

type Status = OutreachContact["status"]
export type Tone = "neutral" | "success" | "warning" | "danger"

/** Plain-English labels for the pipeline statuses, in pipeline order. */
export const STATUS_META: Record<Status, { label: string; tone: Tone }> = {
  pending: { label: "Not contacted", tone: "neutral" },
  contacted: { label: "Contacted", tone: "warning" },
  follow_up: { label: "Followed up", tone: "warning" },
  responded: { label: "Replied", tone: "success" },
  api_requested: { label: "Feed requested", tone: "warning" },
  api_received: { label: "Feed received", tone: "success" },
  integration_pending: { label: "Connecting feed", tone: "warning" },
  integrated: { label: "Live on site", tone: "success" },
  declined: { label: "Declined", tone: "danger" },
  no_response: { label: "No response", tone: "neutral" },
}

export const STATUSES = Object.keys(STATUS_META) as Status[]

/**
 * The pipeline collapsed into the five stages a person actually thinks in.
 * Each maps to the statuses it covers; the page filters on `?stage=`.
 */
export const STAGE_GROUPS = [
  { id: "to_contact", label: "To contact", statuses: ["pending"] },
  { id: "waiting", label: "Waiting for reply", statuses: ["contacted", "follow_up"] },
  {
    id: "talking",
    label: "In conversation",
    statuses: ["responded", "api_requested", "api_received", "integration_pending"],
  },
  { id: "live", label: "Live on site", statuses: ["integrated"] },
  { id: "closed", label: "Closed", statuses: ["declined", "no_response"] },
] as const satisfies ReadonlyArray<{ id: string; label: string; statuses: readonly Status[] }>

export type StageGroupId = (typeof STAGE_GROUPS)[number]["id"]

export function stageGroupOf(status: Status): StageGroupId {
  return STAGE_GROUPS.find((group) => (group.statuses as readonly Status[]).includes(status))!.id
}

/** Mirrors the tiers in OUTREACH_SOURCES.md. */
export const TIERS = [
  { tier: 1, label: "Large platforms" },
  { tier: 2, label: "Farm auction companies" },
  { tier: 3, label: "Regional auctioneers" },
  { tier: 4, label: "Government / municipal" },
  { tier: 5, label: "Software providers" },
  { tier: 6, label: "Marketplaces" },
  { tier: 7, label: "International (Phase 2)" },
]

export function isFollowUpDue(contact: OutreachContact, now = new Date()) {
  return Boolean(
    contact.follow_up_date &&
      new Date(contact.follow_up_date) <= now &&
      stageGroupOf(contact.status) !== "closed" &&
      contact.status !== "integrated"
  )
}

/** One line telling the operator what to do with this company next. */
export function nextStep(contact: OutreachContact, now = new Date()): { text: string; urgent: boolean } {
  if (isFollowUpDue(contact, now)) return { text: "Follow-up is due", urgent: true }

  switch (contact.status) {
    case "pending":
      return contact.contact_email
        ? { text: "Ready for first email", urgent: false }
        : { text: "Add a contact email first", urgent: true }
    case "contacted":
    case "follow_up":
      return { text: "Waiting for their reply", urgent: false }
    case "responded":
      return { text: "Ask for feed / API details", urgent: true }
    case "api_requested":
      return { text: "Waiting on feed details", urgent: false }
    case "api_received":
      return { text: "Send feed details to the developer", urgent: true }
    case "integration_pending":
      return { text: "Feed is being connected", urgent: false }
    case "integrated":
      return { text: "Listings are live", urgent: false }
    default:
      return { text: "Closed", urgent: false }
  }
}

/** The email stage that fits where the company is, preselected in the composer. */
export function suggestedEmailStage(status: Status) {
  switch (status) {
    case "contacted":
    case "follow_up":
    case "no_response":
      return "follow_up"
    case "responded":
      return "api_request"
    case "api_requested":
    case "integration_pending":
      return "integration_followup"
    default:
      return "first_contact"
  }
}
