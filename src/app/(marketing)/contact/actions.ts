"use server"

import { redirect } from "next/navigation"
import { Resend } from "resend"

const TOPICS: Record<string, string> = {
  general: "General question",
  listing: "A listing on the site",
  partner: "Listing our auctions",
  advertising: "Advertising and sponsorship",
  account: "My account",
}

/** Nobody fills in name, email and a message this fast. */
const MIN_FILL_MS = 3000

function text(value: FormDataEntryValue | null, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : ""
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

/**
 * Emails the message to the team through Resend, with the visitor as
 * reply-to so answering it is a plain reply. Nothing is stored.
 */
export async function sendContactMessage(formData: FormData) {
  // Spam traps. Pretend it worked so bots move on.
  // Honeypot: an off-screen field people never see, filled in by bots.
  if (text(formData.get("website"), 200) || text(formData.get("company_website"), 200)) {
    redirect("/contact?sent=1")
  }
  // Time trap: the page stamps when the form was shown. A missing stamp or a
  // submit within a few seconds of loading is a script, not a person typing.
  const started = Number(text(formData.get("form_started"), 20))
  if (!Number.isFinite(started) || started <= 0 || Date.now() - started < MIN_FILL_MS) {
    redirect("/contact?sent=1")
  }

  const name = text(formData.get("name"), 200)
  const email = text(formData.get("email"), 320)
  const phone = text(formData.get("phone"), 50)
  const topic = TOPICS[text(formData.get("topic"), 50)] ?? TOPICS.general
  const message = text(formData.get("message"), 5000)

  if (!name || !email || !message) redirect("/contact?error=missing")
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) redirect("/contact?error=email")

  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.OUTREACH_FROM_EMAIL
  const to = process.env.CONTACT_TO_EMAIL || "partnerships@tractorauction.com"
  if (!apiKey || !from) {
    console.error("[contact] RESEND_API_KEY or OUTREACH_FROM_EMAIL is not configured")
    redirect("/contact?error=failed")
  }

  const rows: [string, string][] = [
    ["Name", name],
    ["Email", email],
    ["Phone", phone || "Not given"],
    ["Topic", topic],
  ]

  const { error } = await new Resend(apiKey).emails.send({
    from,
    to,
    replyTo: email,
    subject: `Contact form: ${topic} from ${name}`,
    text: `${rows.map(([label, value]) => `${label}: ${value}`).join("\n")}\n\n${message}`,
    html: `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;color:#1a1d1e">
  <h2 style="margin:0 0 12px;font-size:18px">New message from the TractorAuction.com contact form</h2>
  <table style="border-collapse:collapse;margin:0 0 16px;font-size:14px">${rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:4px 12px 4px 0;color:#6b7280">${label}</td><td style="padding:4px 0">${escapeHtml(value)}</td></tr>`
    )
    .join("")}</table>
  <p style="margin:0;white-space:pre-wrap;line-height:1.5;font-size:14px">${escapeHtml(message)}</p>
  <p style="margin:16px 0 0;font-size:12px;color:#9ca3af">Reply to this email to answer ${escapeHtml(name)} directly.</p>
</div>`,
  })

  if (error) {
    console.error("[contact] send failed:", error.message)
    redirect("/contact?error=failed")
  }

  redirect("/contact?sent=1")
}
