import type { OutreachContact } from "@/types"

export type OutreachTemplate = {
  id: string
  name: string
  description: string
  /** Steer for the generator. The model writes the copy; this sets the intent. */
  brief: string
}

/**
 * Templates are the brief handed to the generator, not the finished copy —
 * the model adapts each one to the specific company. Editing a draft before
 * sending is always possible in the admin UI.
 */
export const OUTREACH_TEMPLATES: OutreachTemplate[] = [
  {
    id: "intro",
    name: "First contact",
    description: "Opening approach asking about feed or API access.",
    brief:
      "First contact. Introduce TractorAuction.com, explain that we send qualified buyer " +
      "traffic out to their site at no cost to them, and ask who handles data or " +
      "partnership requests. Ask whether they already publish a feed or API.",
  },
  {
    id: "follow_up",
    name: "Follow-up",
    description: "Polite nudge after no reply to the first email.",
    brief:
      "Short follow-up to a previous unanswered email. Be brief and low-pressure, " +
      "restate the single benefit (free outbound traffic to their listings), and make " +
      "it easy to decline or redirect us to the right person.",
  },
  {
    id: "api_request",
    name: "Feed / API request",
    description: "They responded — ask for the technical details.",
    brief:
      "They have expressed interest. Ask for the specific technical details needed to " +
      "integrate: feed or API endpoint, format, authentication, update frequency, and " +
      "any terms of use we should follow. Offer a short call if easier.",
  },
  {
    id: "technical_followup",
    name: "Integration follow-up",
    description: "Chasing feed details that were promised but not sent.",
    brief:
      "They agreed to share feed access but we have not received it. Politely check in, " +
      "confirm what we are still waiting on, and offer to work from whatever format is " +
      "easiest for them, including a CSV export or a shared sheet.",
  },
]

export function findTemplate(id: string) {
  return OUTREACH_TEMPLATES.find((template) => template.id === id)
}

/** Facts about the prospect the model may use. Never invented. */
export function contactContext(contact: OutreachContact) {
  return [
    `Company: ${contact.company_name}`,
    contact.website_url ? `Website: ${contact.website_url}` : null,
    contact.contact_name ? `Contact name: ${contact.contact_name}` : null,
    contact.geographic_coverage ? `Coverage: ${contact.geographic_coverage}` : null,
    contact.inventory_type ? `Inventory: ${contact.inventory_type}` : null,
    contact.existing_api_info ? `Known feed/API info: ${contact.existing_api_info}` : null,
    contact.notes ? `Internal notes: ${contact.notes}` : null,
    `Current pipeline status: ${contact.status}`,
  ]
    .filter(Boolean)
    .join("\n")
}
