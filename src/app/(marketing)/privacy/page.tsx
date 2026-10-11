import type { Metadata } from "next"

import { LegalPage } from "@/components/layout/legal-page"
import { PRIVACY_POLICY, PRIVACY_POLICY_EFFECTIVE } from "@/content/legal/privacy"

export const metadata: Metadata = {
  title: "Privacy Policy — TractorAuction.com",
  description: "How TractorAuction.com collects, uses and protects personal information.",
  alternates: { canonical: "/privacy" },
}

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" effective={PRIVACY_POLICY_EFFECTIVE} blocks={PRIVACY_POLICY} />
  )
}
