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
TractorAuction.com is building the leading search and discovery platform for
agricultural equipment auctions. It aggregates listings from auction companies so
buyers can search one place, then sends those buyers to the original auction site
to bid.

What this means for an auction company:
- We send them qualified buyers who are actively searching for tractors
- We never accept bids ourselves; every transaction happens on their own site
- We increase listing visibility beyond their existing audience
- Listing on TractorAuction.com is free for auction companies
- We only need authorized data access: API, RSS, XML, CSV, or any feed they have

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

  const apiKey = process.env.ANTHROPIC_API_KEY
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
        `Angle for this company (${angle.name}):`,
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
