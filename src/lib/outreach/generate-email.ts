import Anthropic from "@anthropic-ai/sdk"

import { contactContext, findStage, resolveAngle } from "@/lib/outreach/templates"
import type { OutreachContact } from "@/types"

// Haiku 4.5 per CLAUDE.md. Short, high-volume drafting is exactly its shape,
// and at $1/$5 per Mtok a whole 43-company outreach round costs a few cents.
const MODEL = "claude-haiku-4-5"

// The rules below are taken from the "Agent Instructions" and "Value
// Proposition" sections of OUTREACH_SOURCES.md. Change that document and this
// prompt together.
const SYSTEM_PROMPT = `You write partnership outreach emails for TractorAuction.com.

ABOUT THE PLATFORM
TractorAuction.com is a search and discovery platform for agricultural equipment
auctions in the United States. It aggregates listings from auction companies so
buyers can search one place, then sends those buyers to the original auction site
to bid.

What this means for an auction company (these are the ONLY benefits you may state):
- People searching TractorAuction.com see their listings alongside other auctions
- Every click goes to their own listing page; bidding happens only on their site
- We never accept bids ourselves and do not compete with auction companies
- It is another place their listings can be found, in addition to their own site
- Listing on TractorAuction.com is free for auction companies
- We only need authorized data access: API, RSS, XML, CSV, or any feed they have

The platform is new. We have no traffic, audience, or buyer figures to share, so
describe what the platform does, never how big, busy, or effective it is.

RULES FOR EVERY EMAIL
- Address the company by name. Never use a generic greeting.
- Reference their specific auction type or specialty where you are told it.
- State clearly that we aggregate listings and send buyers to the original site
  to bid, and that we do not compete with auction companies.
- Request the integration method you are given, not a generic "data access".
- Under 200 words.
- Professional tone. No dashes of any kind. No emojis. No markdown. No bullet
  characters. Plain sentences and paragraphs only.
- No hype, no superlatives, no fake urgency, no invented statistics.
- Never invent facts about the recipient's business, traffic, or inventory. Use
  only what you are given. If you do not know something, do not mention it.
- Never claim TractorAuction.com already lists them unless told it does.
- Never compliment or characterize the recipient: nothing about their size,
  scale, reach, reputation, or the strength or quality of their inventory. The
  angle notes you are given are internal guidance; never restate them.
- Never describe our coverage as wider than the United States.
- The only commercial term you may state is that listing is free. Never mention
  revenue share, pricing, exclusivity, contracts, or anything else not given.
- Never name a parent company, owner, or any other business unless told to.
- Write as "we" throughout. Never "I".
- Never claim a track record: no "we have found", no results for other
  partners, no testimonials. The platform is new; describe what it does.
- Never describe our users or audience: no "qualified buyers", "active buyers",
  "actively searching", "serious bidders", "national audience", "our buyers",
  "buyer volume", "traffic", or "reach". Say "people searching for equipment"
  or "anyone searching our site" instead.
- Never promise results: no more bidders, more traffic, higher prices, better
  recovery, or "incremental" anything. Say their listings can be found in one
  more place, nothing stronger.
- Never promise what the integration will cost them in effort: no "no work on
  your part", "no maintenance", "easy setup", or "takes minutes". Just ask what
  they can share.
- If the company name lists more than one business (for example "X (including
  Y)"), name every business in the email.
- Sign off exactly as: The TractorAuction.com Partnership Team

Return your answer in exactly this shape, with nothing before or after:
Subject: <the subject line>

<the email body>`

export type GeneratedEmail = {
  subject: string
  body: string
  angle: string
  model: string
  inputTokens: number
  outputTokens: number
}

/** Splits the "Subject: ...\n\n<body>" reply. Falls back if the shape drifts. */
function parseEmail(raw: string): { subject: string; body: string } {
  const match = raw.match(/^\s*Subject:\s*(.+?)\n+([\s\S]+)$/)

  if (!match) {
    return {
      subject: "TractorAuction.com partnership",
      body: raw.trim(),
    }
  }

  return { subject: match[1].trim(), body: match[2].trim() }
}

export async function generateOutreachEmail(
  contact: OutreachContact,
  stageId: string
): Promise<GeneratedEmail> {
  const stage = findStage(stageId)
  if (!stage) throw new Error(`Unknown outreach stage: ${stageId}`)

  const angle = resolveAngle(contact)
  const ask = contact.integration_request ?? angle.defaultAsk

  // ANTHROPIC_API_KEY is the documented name (README, CLAUDE.md) and what the
  // Anthropic SDK and ecosystem tooling expect by default. Claude_API_KEY is a
  // fallback for the key as it's actually named in Vercel today — remove this
  // once a correctly-named var is added there; nothing else needs to change.
  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.Claude_API_KEY
  if (!apiKey || apiKey.startsWith("your_")) {
    throw new Error(
      "ANTHROPIC_API_KEY is not configured. Add it to .env.local to generate outreach emails."
    )
  }

  const client = new Anthropic({ apiKey })

  const messages: Anthropic.MessageParam[] = [
    {
      role: "user",
      content: [
        `Write this email.`,
        ``,
        `Stage: ${stage.brief}`,
        ``,
        `Angle for this company (${angle.name}). Internal guidance only, never quote or paraphrase it to the recipient:`,
        angle.lead,
        angle.caution ? `\nImportant: ${angle.caution}` : "",
        ``,
        `Ask them for: ${ask}`,
        ``,
        `What we know about them:`,
        contactContext(contact),
      ]
        .filter((line) => line !== "")
        .join("\n"),
    },
  ]

  try {
    const response = await client.messages.create({
      model: MODEL,
      // Under 200 words is a deliberately short output; 1024 is ample.
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages,
    })

    if (response.stop_reason === "refusal") {
      throw new Error("The model declined to draft this email. Adjust the notes and retry.")
    }

    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("")

    const { subject, body } = parseEmail(text)

    return {
      subject,
      body,
      angle: angle.name,
      model: response.model,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    }
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      throw new Error("ANTHROPIC_API_KEY was rejected. Check the key in .env.local.")
    }
    if (error instanceof Anthropic.RateLimitError) {
      throw new Error("Anthropic rate limit hit. Wait a moment and try again.")
    }
    if (error instanceof Anthropic.APIError) {
      throw new Error(`Anthropic API error ${error.status}: ${error.message}`)
    }
    throw error
  }
}
