import { CheckCircle2, Mail } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { Button } from "@/components/ui/button"

import { sendContactMessage } from "./actions"

export const metadata: Metadata = {
  title: "Contact Us — TractorAuction.com",
  description:
    "Questions about a listing, your account, listing your auctions, or advertising? Send the TractorAuction.com team a message.",
  alternates: { canonical: "/contact" },
}

const TOPICS = [
  { value: "general", label: "General question" },
  { value: "listing", label: "A listing on the site" },
  { value: "partner", label: "Listing our auctions" },
  { value: "advertising", label: "Advertising and sponsorship" },
  { value: "account", label: "My account" },
]

const ERRORS: Record<string, string> = {
  missing: "Please fill in your name, email and message.",
  email: "That email address does not look right. Please check it and try again.",
  failed: "Something went wrong sending your message. Please try again in a few minutes.",
}

const fieldClass =
  "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

function Field({
  label,
  children,
  wide,
}: {
  label: string
  children: React.ReactNode
  wide?: boolean
}) {
  return (
    <label className={`flex flex-col gap-1.5 ${wide ? "sm:col-span-2" : ""}`}>
      <span className="text-sm font-medium text-foreground">{label}</span>
      {children}
    </label>
  )
}

export default async function ContactPage(props: PageProps<"/contact">) {
  const params = await props.searchParams
  const sent = params.sent === "1"
  const error = typeof params.error === "string" ? ERRORS[params.error] ?? ERRORS.failed : undefined

  if (sent) {
    return (
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-3 px-6 py-20 text-center">
        <CheckCircle2 className="size-10 text-primary" />
        <h1 className="text-2xl font-semibold text-foreground">Message sent</h1>
        <p className="text-muted-foreground">
          Thanks for getting in touch. We will reply to the email address you gave us.
        </p>
        <Button variant="outline" nativeButton={false} render={<Link href="/" />}>
          Back to TractorAuction.com
        </Button>
      </main>
    )
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-foreground">Contact us</h1>
        <p className="text-sm text-muted-foreground">
          Questions about a listing, your account, listing your auctions, or advertising?
          Send us a message and we will get back to you. For bidding, payment or pickup,
          please contact the auction company that runs the sale.
        </p>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      <form action={sendContactMessage} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Your name">
          <input name="name" required autoComplete="name" className={fieldClass} />
        </Field>
        <Field label="Email">
          <input name="email" type="email" required autoComplete="email" className={fieldClass} />
        </Field>

        <Field label="Phone (optional)">
          <input name="phone" type="tel" autoComplete="tel" className={fieldClass} />
        </Field>
        <Field label="Topic">
          <select name="topic" defaultValue="general" className={fieldClass}>
            {TOPICS.map((topic) => (
              <option key={topic.value} value={topic.value}>
                {topic.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Message" wide>
          <textarea
            name="message"
            required
            rows={6}
            maxLength={5000}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </Field>

        {/* Honeypot for bots; hidden from people and screen readers. */}
        <div aria-hidden className="hidden">
          <label>
            Leave this empty
            <input name="company_website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>

        <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
          <Button type="submit" size="lg">
            Send message
          </Button>
          <a
            href="mailto:partnerships@tractorauction.com"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground hover:underline"
          >
            <Mail className="size-4" /> partnerships@tractorauction.com
          </a>
        </div>
      </form>
    </main>
  )
}
