import type { OutreachContact } from "@/types"

/**
 * Encodes OUTREACH_SOURCES.md (repo root). That document is the human-readable
 * source of truth; this file is what the generator actually reads.
 *
 * Two axes decide the email:
 *   - the ANGLE comes from the company's tier (what to lead with, what to ask for)
 *   - the STAGE comes from where they are in the pipeline (first contact, chase, etc.)
 */

export type OutreachAngleId =
  | "tier1_platform"
  | "regional"
  | "government"
  | "software_provider"
  | "marketplace"
  | "international"

export type OutreachAngle = {
  id: OutreachAngleId
  name: string
  /** What the opening should sell. */
  lead: string
  /** Default integration ask when the row has none. */
  defaultAsk: string
  /** Anything the writer must be careful about. */
  caution?: string
}

export const OUTREACH_ANGLES: Record<OutreachAngleId, OutreachAngle> = {
  tier1_platform: {
    id: "tier1_platform",
    name: "Tier 1 — large platform",
    lead:
      "Lead with traffic and buyer volume: we send qualified, actively searching buyers " +
      "straight to their listings. They are large enough to care about incremental " +
      "bidder reach, and likely already have data infrastructure.",
    defaultAsk: "an official API or XML/JSON feed",
  },
  regional: {
    id: "regional",
    name: "Tier 2/3 — regional auctioneer",
    lead:
      "Lead with expanded reach: get their listings in front of national buyers they " +
      "would never reach on their own. They keep full control of the auction and the " +
      "buyer relationship, and it costs them nothing.",
    defaultAsk: "a CSV export, RSS feed, or manual submission through our Partner Center",
  },
  government: {
    id: "government",
    name: "Tier 4 — government / municipal",
    lead:
      "Lead with public visibility and transparency: more eyes on surplus sales means " +
      "better recovery for the public body, and the data is already public.",
    defaultAsk: "a public API, RSS feed, or authorized data export",
  },
  software_provider: {
    id: "software_provider",
    name: "Tier 5 — auction software provider",
    lead:
      "Lead with leverage: one integration on their end connects every auction company " +
      "running on their platform to a national audience. Frame it as value they can pass " +
      "on to their own clients, not just to us.",
    defaultAsk:
      "a partner API or white-label data feed covering their client auction companies",
  },
  marketplace: {
    id: "marketplace",
    name: "Tier 6 — mixed marketplace",
    lead:
      "Lead with the complementary slice: we are focused on auction inventory, which is " +
      "a subset of what they list. Position it as a data partnership or cross-listing " +
      "arrangement between adjacent products.",
    defaultAsk: "a data partnership or cross-listing arrangement",
    caution:
      "This company may be a competitor. Do not imply we will replace or outrank them, " +
      "and do not disclose our coverage or traffic figures.",
  },
  international: {
    id: "international",
    name: "Tier 7 — international",
    lead:
      "Lead with access to US buyers for the inventory they already ship or sell " +
      "internationally. Keep it exploratory; this is a Phase 2 conversation.",
    defaultAsk: "an international data feed or API covering US-relevant inventory",
  },
}

/** Tier number from the seed maps directly to an angle. */
const TIER_ANGLES: Record<number, OutreachAngleId> = {
  1: "tier1_platform",
  2: "regional",
  3: "regional",
  4: "government",
  5: "software_provider",
  6: "marketplace",
  7: "international",
}

/**
 * Falls back to name and field matching when tier is null — a contact added by
 * hand through the admin UI will not have one.
 */
export function resolveAngle(contact: OutreachContact): OutreachAngle {
  if (contact.tier && TIER_ANGLES[contact.tier]) {
    // HiBid sits in Tier 1 but the software-provider angle is worth far more.
    if (contact.tier === 1 && /hibid|auction flex/i.test(contact.company_name)) {
      return OUTREACH_ANGLES.software_provider
    }
    return OUTREACH_ANGLES[TIER_ANGLES[contact.tier]]
  }

  const haystack = [
    contact.company_name,
    contact.inventory_type,
    contact.geographic_coverage,
  ]
    .filter(Boolean)
    .join(" ")

  if (/software|platform|wavebid|bidjs|auction mobility|auction flex/i.test(haystack)) {
    return OUTREACH_ANGLES.software_provider
  }
  if (/gov|municipal|surplus|gsa/i.test(haystack)) return OUTREACH_ANGLES.government
  if (/marketplace/i.test(haystack)) return OUTREACH_ANGLES.marketplace

  return OUTREACH_ANGLES.regional
}

export type OutreachStage = {
  id: string
  name: string
  description: string
  brief: string
}

/** Where they are in the pipeline. Chosen by the person sending. */
export const OUTREACH_STAGES: OutreachStage[] = [
  {
    id: "first_contact",
    name: "First contact",
    description: "Opening approach asking about feed or API access.",
    brief:
      "First contact. Introduce TractorAuction.com, make the value concrete for this " +
      "company, and ask for the integration named below. Also ask who handles data or " +
      "partnership requests, in case this is not the right person.",
  },
  {
    id: "follow_up",
    name: "Follow-up",
    description: "Polite nudge after no reply to the first email.",
    brief:
      "Short follow-up to a previous unanswered email. Be brief and low pressure, " +
      "restate the single strongest benefit, and make it easy to decline or redirect us " +
      "to the right person. Do not repeat the whole pitch.",
  },
  {
    id: "api_request",
    name: "Feed / API request",
    description: "They responded — ask for the technical details.",
    brief:
      "They have expressed interest. Ask for the specific technical details needed to " +
      "integrate: endpoint or feed URL, format, authentication, update frequency, and " +
      "any terms of use we must follow. Offer a short call if that is easier.",
  },
  {
    id: "integration_followup",
    name: "Integration follow-up",
    description: "Chasing feed details that were promised but not sent.",
    brief:
      "They agreed to share feed access but we have not received it. Politely check in, " +
      "confirm exactly what we are waiting on, and offer to work from whatever format is " +
      "easiest for them, including a CSV export or a shared sheet.",
  },
]

export function findStage(id: string) {
  return OUTREACH_STAGES.find((stage) => stage.id === id)
}

/** Facts about the prospect the model may use. Never invented. */
export function contactContext(contact: OutreachContact) {
  const angle = resolveAngle(contact)

  return [
    `Company: ${contact.company_name}`,
    contact.website_url ? `Website: ${contact.website_url}` : null,
    contact.contact_name ? `Contact name: ${contact.contact_name}` : null,
    contact.geographic_coverage ? `Coverage: ${contact.geographic_coverage}` : null,
    contact.inventory_type ? `Inventory: ${contact.inventory_type}` : null,
    contact.tier ? `Priority tier: ${contact.tier} (${angle.name})` : null,
    `Integration to request: ${contact.integration_request ?? angle.defaultAsk}`,
    contact.existing_api_info ? `Known feed/API info: ${contact.existing_api_info}` : null,
    contact.notes ? `Internal notes: ${contact.notes}` : null,
    `Current pipeline status: ${contact.status}`,
  ]
    .filter(Boolean)
    .join("\n")
}
