import { CheckCircle2 } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { submitPartnerApplication } from "@/app/partner/actions"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Partner Application — TractorAuction.com",
  description: "Apply to list your tractor and equipment auctions on TractorAuction.com.",
  alternates: { canonical: "/partner/register" },
}

const FEED_TYPES = [
  { value: "", label: "Not sure yet" },
  { value: "api", label: "API" },
  { value: "rss", label: "RSS" },
  { value: "xml", label: "XML" },
  { value: "csv", label: "CSV" },
  { value: "ftp", label: "FTP drop" },
  { value: "email", label: "Email export" },
  { value: "google_sheets", label: "Google Sheets" },
  { value: "manual", label: "Manual entry" },
]

const fieldClass =
  "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

function Field({
  label,
  hint,
  children,
  wide,
}: {
  label: string
  hint?: string
  children: React.ReactNode
  wide?: boolean
}) {
  return (
    <label className={`flex flex-col gap-1.5 ${wide ? "sm:col-span-2" : ""}`}>
      <span className="text-sm font-medium text-foreground">{label}</span>
      {children}
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </label>
  )
}

export default async function PartnerRegisterPage(props: PageProps<"/partner/register">) {
  const params = await props.searchParams
  const submitted = params.submitted === "1"
  const error = typeof params.error === "string" ? params.error : undefined

  if (submitted) {
    return (
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-3 px-6 py-20 text-center">
        <CheckCircle2 className="size-10 text-primary" />
        <h1 className="text-2xl font-semibold text-foreground">Application received</h1>
        <p className="text-muted-foreground">
          Thanks — we will review your listings and get back to you within two business days
          at the address you gave us.
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
        <h1 className="text-2xl font-semibold text-foreground">Partner application</h1>
        <p className="text-sm text-muted-foreground">
          Tell us about your auction business. Only the company name and an email address
          are required — everything else helps us set up your listings faster.
        </p>
      </div>

      {error && (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error === "missing"
            ? "Please provide at least a company name and a contact email."
            : "Something went wrong submitting your application. Please try again."}
        </p>
      )}

      <form action={submitPartnerApplication} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Company name">
          <input name="company_name" required className={fieldClass} />
        </Field>
        <Field label="Website">
          <input name="website_url" type="url" placeholder="https://" className={fieldClass} />
        </Field>

        <Field label="Your name">
          <input name="contact_name" className={fieldClass} />
        </Field>
        <Field label="Email">
          <input name="contact_email" type="email" required className={fieldClass} />
        </Field>

        <Field label="Phone">
          <input name="contact_phone" type="tel" className={fieldClass} />
        </Field>
        <Field label="Areas you cover" hint="States, regions, or nationwide.">
          <input name="geographic_coverage" className={fieldClass} />
        </Field>

        <Field label="What you sell" hint="Tractors, combines, tillage, mixed farm equipment.">
          <input name="inventory_type" className={fieldClass} />
        </Field>
        <Field label="Listings per month" hint="A rough number is fine.">
          <input name="listings_per_month" className={fieldClass} />
        </Field>

        <Field label="How do you publish listings?">
          <select name="feed_type" defaultValue="" className={fieldClass}>
            {FEED_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Feed or API URL" hint="Leave blank if you do not have one.">
          <input name="feed_url" className={fieldClass} />
        </Field>

        <Field label="Anything else we should know?" wide>
          <textarea
            name="notes"
            rows={4}
            className={`${fieldClass} h-auto py-2`}
            placeholder="Sale schedule, existing integrations, questions."
          />
        </Field>

        <div className="flex flex-col gap-2 sm:col-span-2">
          <Button type="submit" size="lg">
            Submit application
          </Button>
          <p className="text-xs text-muted-foreground">
            Listing with us is free. We never take a commission and never ask for
            exclusivity.
          </p>
        </div>
      </form>
    </main>
  )
}
