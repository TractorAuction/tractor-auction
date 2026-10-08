import type { Metadata } from "next"

import { LegalPage, type LegalSection } from "@/components/layout/legal-page"

export const metadata: Metadata = {
  title: "Privacy Policy — TractorAuction.com",
  description: "What TractorAuction.com collects, why, and how to control it.",
  alternates: { canonical: "/privacy" },
}

// Describes what the site actually does today. Keep in step with the code:
// a new data flow (analytics, a new email type, a new processor) belongs here.
const sections: LegalSection[] = [
  {
    heading: "What we collect",
    body: [
      "Account details: if you create an account, your email address, your name if you give one, and a password, which is stored only as a secure hash by our authentication provider.",
      "Your saved items: the auctions you add to your watchlist, the searches you save, and whether you have email alerts turned on.",
      "Outbound clicks: when you click through to an auction, we record which listing, which auction company, the time, and your account if you are signed in. This is how we report traffic to auction companies.",
      "Partner applications: the company and contact details an auction company submits through the Partner Center.",
      "Messages you send us by email.",
    ],
  },
  {
    heading: "What we do not collect",
    body: [
      "We do not take bids, payments or card details. All bidding and payment happen on the auction company's own website, under its own privacy policy.",
      "We do not sell your personal information, and we do not use third party advertising trackers.",
    ],
  },
  {
    heading: "Cookies and local storage",
    body: [
      "We use a cookie to keep you signed in. Your comparison list is stored in your own browser and is not sent to us until you open the compare page.",
    ],
  },
  {
    heading: "Emails",
    body: [
      "If you turn on alerts, we email you about new auctions matching your saved searches and about watched auctions that are about to end. Every alert email has a link to turn alerts off, and you can change this at any time under Account, Alerts.",
      "Account emails, such as confirming your address or resetting your password, are sent when you ask for them.",
    ],
  },
  {
    heading: "Service providers",
    body: [
      "We use a small number of providers to run the site: Vercel (hosting), Supabase (database and sign in), Meilisearch (search), and Resend (email delivery). They process data only to provide their service to us.",
    ],
  },
  {
    heading: "Your choices",
    body: [
      "You can delete saved searches and watchlist items yourself at any time. To delete your account and its data, email us from the address on the account and we will remove it.",
    ],
  },
  {
    heading: "Contact",
    body: ["Questions about privacy: partnerships@tractorauction.com."],
  },
]

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="October 9, 2026"
      intro="TractorAuction.com is a search and aggregation platform for tractor and farm equipment auctions. This page explains what information we handle and why."
      sections={sections}
    />
  )
}
