import type { Metadata } from "next"

import { LegalPage } from "@/components/layout/legal-page"
import { TERMS, TERMS_EFFECTIVE } from "@/content/legal/terms"

export const metadata: Metadata = {
  title: "Terms and Conditions — TractorAuction.com",
  description: "The terms and conditions for using TractorAuction.com.",
  alternates: { canonical: "/terms" },
}

export default function TermsPage() {
  return <LegalPage title="Terms and Conditions" effective={TERMS_EFFECTIVE} blocks={TERMS} />
}
