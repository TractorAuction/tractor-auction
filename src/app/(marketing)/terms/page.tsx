import type { Metadata } from "next"

import { LegalPage, type LegalSection } from "@/components/layout/legal-page"

export const metadata: Metadata = {
  title: "Terms of Use — TractorAuction.com",
  description: "The terms for using TractorAuction.com.",
  alternates: { canonical: "/terms" },
}

const sections: LegalSection[] = [
  {
    heading: "What TractorAuction.com is",
    body: [
      "TractorAuction.com is a search and aggregation platform. We are not the auctioneer, seller, or bidding platform. We list auctions published by third party auction companies and link you to their websites, where all registration, bidding, payment, inspection and transport take place under their terms.",
    ],
  },
  {
    heading: "Listing information",
    body: [
      "Listing details such as descriptions, hours, current bids and end times come from the auction companies and can change or be wrong. Always confirm every detail, including condition, fees and terms, on the auction company's own listing before you bid. We do not guarantee the accuracy, availability or condition of any item.",
      "Final bids shown under auction results are the last price published when an auction closed and are not always completed sales.",
    ],
  },
  {
    heading: "No part in your transaction",
    body: [
      "Any purchase is a contract between you and the auction company or seller. We are not a party to it, do not hold funds, and are not responsible for the conduct of auction companies, sellers or other buyers.",
    ],
  },
  {
    heading: "Sponsored content",
    body: [
      "Some listings and auction companies pay for more prominent placement. These are always labelled Sponsored or Featured. Payment does not change the listing information itself.",
    ],
  },
  {
    heading: "Your account",
    body: [
      "Keep your password private and use the site lawfully. Do not scrape, overload or interfere with the site, or misuse other people's information. We may suspend accounts that do.",
    ],
  },
  {
    heading: "Partners",
    body: [
      "Auction companies that submit feeds or listings confirm they have the right to publish that information and that their listings are accurate. We may decline or remove any submission.",
    ],
  },
  {
    heading: "Liability",
    body: [
      "The site is provided as is. To the extent the law allows, we are not liable for losses arising from your use of the site or of any auction company's website.",
    ],
  },
  {
    heading: "Changes and contact",
    body: [
      "We may update these terms; the date above shows the latest version. Questions: partnerships@tractorauction.com.",
    ],
  },
]

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Use"
      updated="October 9, 2026"
      intro="By using TractorAuction.com you agree to these terms."
      sections={sections}
    />
  )
}
