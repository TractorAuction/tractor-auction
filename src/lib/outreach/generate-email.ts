import Anthropic from "@anthropic-ai/sdk"

import { contactContext, findTemplate } from "@/lib/outreach/templates"
import type { OutreachContact } from "@/types"

// Haiku 4.5 per CLAUDE.md. Short, high-volume drafting is exactly its shape,
// and at $1/$5 per Mtok a whole 45-company outreach round costs a few cents.
const MODEL = "claude-haiku-4-5"

const SYSTEM_PROMPT = `You write partnership outreach emails for TractorAuction.com.

TractorAuction.com is a search and discovery platform for tractor and agricultural
equipment auctions. It aggregates listings from many auction sources so buyers can
search one place, then sends them out to the original auction site to bid. No bidding
happens on TractorAuction.com, and it does not compete with auction houses for buyers
or sellers — it sends them qualified traffic for free.

Rules for every email you write:
- Plain text. No markdown, no HTML, no bullet characters.
- Under 150 words. Auction house staff are busy and skim.
- Concrete and specific to the company you are told about.
- One clear ask, at the end.
- No hype, no superlatives, no fake urgency, no invented statistics.
- Never invent facts about the recipient's business, traffic, or inventory. Use only
  what you are given. If you do not know something, do not mention it.
- Never claim TractorAuction.com already lists them unless told it does.
- Sign off as the TractorAuction.com partnerships team without inventing a person's name.

Return your answer in exactly this shape, with nothing before or after:
Subject: <the subject line>

<the email body>`

export type GeneratedEmail = {
  subject: string
  body: string
  model: string
  inputTokens: number
  outputTokens: number
}

/** Splits the "Subject: ...\n\n<body>" reply. Falls back if the shape drifts. */
function parseEmail(raw: string): { subject: string; body: string } {
  const match = raw.match(/^\s*Subject:\s*(.+?)\n+([\s\S]+)$/)

  if (!match) {
    return {
      subject: `TractorAuction.com partnership`,
      body: raw.trim(),
    }
  }

  return { subject: match[1].trim(), body: match[2].trim() }
}

export async function generateOutreachEmail(
  contact: OutreachContact,
  templateId: string
): Promise<GeneratedEmail> {
  const template = findTemplate(templateId)
  if (!template) throw new Error(`Unknown outreach template: ${templateId}`)

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
      content: `Write this email.\n\nGoal: ${template.brief}\n\nWhat we know about them:\n${contactContext(contact)}`,
    },
  ]

  try {
    const response = await client.messages.create({
      model: MODEL,
      // An outreach email is a deliberately short output; 1024 is ample.
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
