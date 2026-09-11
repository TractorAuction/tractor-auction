# TractorAuction.com — Outreach Agent Source List

## How the Claude Agent Uses This File

This file is the knowledge base for the TractorAuction.com outreach agent.
When generating outreach emails, the agent reads this file to:

1. Know which company it is contacting and their tier priority
2. Tailor the email based on company type (large platform vs small regional vs government vs software provider)
3. Know what integration method to request (API, RSS, XML, CSV, feed URL)
4. Understand the partnership value proposition to communicate
5. Track which companies to contact first based on priority order

Drop this file into your project at: `lib/outreach/OUTREACH_SOURCES.md`

---

## Agent Instructions

When generating an outreach email, always follow these rules:

- Address the company by name, never use a generic greeting
- Reference their specific auction type or specialty where known
- Explain TractorAuction.com clearly: we aggregate listings and send buyers to the original auction site to bid, we do not compete with auction companies
- Request the most appropriate integration method based on their tier and type
- Keep the email under 200 words
- Professional tone, no dashes, no emojis
- Sign off as: The TractorAuction.com Partnership Team
- For Tier 1 large platforms, lead with traffic and buyer volume value
- For regional auctioneers, lead with expanded reach beyond their local area
- For government sources, lead with public visibility and transparency
- For software providers, lead with the potential to unlock all their client auction companies at once through a single integration

---

## Value Proposition to Communicate

TractorAuction.com is building the leading search and discovery platform for agricultural equipment auctions.

What this means for auction companies:
- We send them qualified buyers who are actively searching for tractors
- We never accept bids ourselves, all transactions happen on the original auction site
- We increase their listing visibility beyond their existing audience
- Listing on TractorAuction.com is free for auction companies
- We only need authorized data access: API, RSS, XML, CSV, or any feed they can provide

---

## Tier 1 — Highest Priority (Contact First)

These account for the majority of tractor auctions in North America.
Request: Official API or XML/JSON feed. These are large platforms likely to have existing data infrastructure.

| # | Company | URL | Integration to Request |
|---|---|---|---|
| 1 | EquipmentFacts | https://www.equipmentfacts.com | API or XML feed |
| 2 | AuctionTime | https://www.auctiontime.com | API or RSS feed |
| 3 | BigIron Auctions | https://www.bigiron.com | API or XML feed |
| 4 | Purple Wave Auction | https://www.purplewave.com | API or XML feed |
| 5 | Ritchie Bros. | https://www.rbauction.com | Official API |
| 6 | IronPlanet | https://www.ironplanet.com | Official API |
| 7 | BidSpotter | https://www.bidspotter.com | API or RSS feed |
| 8 | Proxibid | https://www.proxibid.com | API or XML feed |
| 9 | HiBid | https://www.hibid.com | API (Auction Flex integration) |
| 10 | GovDeals | https://www.govdeals.com | Public API or RSS |
| 11 | GSA Auctions | https://gsaauctions.gov | Public data feed |

---

## Tier 2 — Farm-Specific Auction Companies

These companies operate their own platforms or proprietary auction software.
Request: CSV export, RSS feed, XML feed, or manual listing submission via Partner Center.
Angle: Expanded buyer reach beyond their local or regional audience.

| Company | URL |
|---|---|
| Steffes Group | https://www.steffesgroup.com |
| Miedema Asset Management (1800LastBid) | https://www.1800lastbid.com |
| Sullivan Auctioneers | https://www.sullivanauctioneers.com |
| Wieman Land & Auction | https://www.wiemanauction.com |
| Aumann Auctions | https://www.aumannauctions.com |
| Schrader Real Estate & Auction | https://www.schraderauction.com |
| Merit Auctions | https://www.meritauctions.com |
| Mowrey Auction Company | https://www.mowreyauction.com |
| Yoder & Frey | https://www.yoderandfrey.com |
| Hansen Auction Group | https://www.hansenauctiongroup.com |
| Zomer Company Realty & Auction | https://www.zomercompany.com |
| Pifer's Auction & Realty | https://www.pifers.com |
| Witcher Auctions | https://www.witcherauctions.com |

---

## Tier 3 — Regional Agricultural Auctioneers

Smaller regional companies. Thousands of annual tractor listings collectively.
Request: CSV or spreadsheet export, manual submission, or RSS if available.
Angle: Get their listings in front of national buyers they would never reach on their own.

| Company | URL |
|---|---|
| Maring Auction Company | https://www.maringauction.com |
| Kramer Auction Service | https://www.kramerauction.com |
| Girard Auction & Land Brokers | https://www.girardauction.com |
| McGrew Equipment Auctions | https://www.mcgrewonlineauctions.com |
| Vanderbrink Auctions | https://www.vanderbrinkauctions.com |

---

## Tier 4 — Government & Municipal Sources

Often feature late-model tractors and municipal equipment. Public data is generally accessible.
Request: Public API, RSS feed, or authorized data export.
Angle: Increased public visibility and transparency for government surplus sales.

| Company | URL |
|---|---|
| GovDeals | https://www.govdeals.com |
| Public Surplus | https://www.publicsurplus.com |
| Municibid | https://www.municibid.com |
| GSA Auctions | https://gsaauctions.gov |

---

## Tier 5 — Auction Software Providers (High Value)

IMPORTANT: These are especially high-value targets.
A single integration with one software provider could unlock listings from dozens or hundreds of independent auction companies that all use their platform.
Request: Partner API or white-label data feed that covers all their client auction companies.
Angle: One integration, maximum inventory coverage for both parties.

| Company | URL | Why High Value |
|---|---|---|
| HiBid (Auction Flex) | https://www.hibid.com | Powers hundreds of independent auctioneers |
| Wavebid | https://wavebid.com | Auction management platform with many clients |
| BidJS | https://bidjs.com | Auction software used by regional companies |
| Auction Mobility | https://www.auctionmobility.com | White-label auction platform |

---

## Tier 6 — Mixed Equipment Marketplaces

These are primarily marketplaces but include substantial auction inventory.
Note: Some of these may be competitors. Approach carefully. Focus on the ones that have auction inventory as a subset of their listings.
Request: Data partnership or cross-listing arrangement.

| Company | URL |
|---|---|
| MachineryTrader | https://www.machinerytrader.com |
| TractorHouse | https://www.tractorhouse.com |
| Fastline | https://www.fastline.com |
| MarketBook | https://www.marketbook.com |
| Machinio | https://www.machinio.com |

---

## Tier 7 — International Sources (Phase 2)

Contact after strong U.S. coverage is established.
Request: International data feed or API for U.S.-relevant inventory.

| Company | URL | Region |
|---|---|---|
| Euro Auctions | https://www.euroauctions.com | UK / Europe |
| Cheffins | https://www.cheffins.co.uk | UK |
| Aumann Auctions | https://www.aumannauctions.com | International |
| Pickles Auctions | https://www.pickles.com.au | Australia |
| AllSurplus | https://www.allsurplus.com | Global |

---

## Outreach Status Pipeline

Each company moves through these stages in the outreach_contacts table:

| Status | Meaning |
|---|---|
| pending | Not yet contacted |
| contacted | Initial email sent |
| follow_up | No reply after 7 days, send follow-up |
| responded | Company replied |
| api_requested | We have formally requested API or feed access |
| api_received | We have received API credentials or feed URL |
| integration_pending | Developer is building the connector |
| integrated | Live on TractorAuction.com |
| declined | Company said no |
| no_response | No reply after 2 follow-ups |

---

## Outreach Email Templates

### Template 1: Tier 1 Large Platforms

Subject: Partnership Opportunity: List Your Auctions on TractorAuction.com

Body:
We are building TractorAuction.com, a national search and discovery platform for tractor and agricultural equipment auctions. Our platform aggregates listings from leading auction companies and connects active buyers directly to the original auction site to bid. We never accept bids ourselves.

We would like to explore a data partnership with [Company Name]. We are looking to display your active tractor and agricultural equipment listings on TractorAuction.com, with clear attribution and direct outbound links to your platform for all buyer activity.

We support API, XML, JSON, RSS, and CSV integrations and are happy to work with whatever data format you already use.

Would you be open to a brief conversation or could you point us to the right contact for data partnerships?

The TractorAuction.com Partnership Team

---

### Template 2: Tier 2 and 3 Regional Companies

Subject: Get Your Auctions in Front of National Buyers

Body:
We are building TractorAuction.com, a national search platform dedicated to tractor and agricultural equipment auctions. We are reaching out to leading regional auction companies to invite them to list their inventory on our platform.

Here is how it works: we display your active listings on TractorAuction.com with full attribution. When a buyer is interested, we send them directly to your website to register and bid. You keep full control of the auction and the buyer relationship.

This is completely free for auction companies. We simply ask for authorized access to your listing data via API, RSS, CSV, or whatever format works for you.

We would love to feature [Company Name] as a launch partner. Would you be open to connecting?

The TractorAuction.com Partnership Team

---

### Template 3: Auction Software Providers

Subject: Data Partnership Opportunity: TractorAuction.com

Body:
We are building TractorAuction.com, a national aggregation and search platform for agricultural equipment auctions. We are reaching out to [Company Name] because a partnership with you could benefit not just your platform but every auction company that uses your software.

We are looking to explore a data integration that would allow TractorAuction.com to display auction listings from companies running on the [Company Name] platform, with full attribution and direct outbound links for all buyer activity. A single integration on your end could connect dozens of your client auction companies to a national audience of active equipment buyers.

Would you be open to discussing a partner API or data feed arrangement?

The TractorAuction.com Partnership Team

---

## How to Seed This List Into the Database

Run this in your seed script at `lib/outreach/seed.ts`:

```ts
import { createClient } from '@/lib/supabase/server'

const companies = [
  // Tier 1
  { company_name: 'EquipmentFacts', website_url: 'https://www.equipmentfacts.com', contact_email: null, inventory_type: 'Agricultural equipment auctions', geographic_coverage: 'North America' },
  { company_name: 'AuctionTime', website_url: 'https://www.auctiontime.com', contact_email: null, inventory_type: 'Agricultural equipment auctions', geographic_coverage: 'North America' },
  { company_name: 'BigIron Auctions', website_url: 'https://www.bigiron.com', contact_email: null, inventory_type: 'Farm and construction equipment', geographic_coverage: 'North America' },
  { company_name: 'Purple Wave Auction', website_url: 'https://www.purplewave.com', contact_email: null, inventory_type: 'Agricultural and construction equipment', geographic_coverage: 'North America' },
  { company_name: 'Ritchie Bros.', website_url: 'https://www.rbauction.com', contact_email: null, inventory_type: 'Heavy equipment and trucks', geographic_coverage: 'North America' },
  { company_name: 'IronPlanet', website_url: 'https://www.ironplanet.com', contact_email: null, inventory_type: 'Used heavy equipment', geographic_coverage: 'North America' },
  { company_name: 'BidSpotter', website_url: 'https://www.bidspotter.com', contact_email: null, inventory_type: 'Industrial and agricultural auctions', geographic_coverage: 'North America' },
  { company_name: 'Proxibid', website_url: 'https://www.proxibid.com', contact_email: null, inventory_type: 'Multi-category auctions', geographic_coverage: 'North America' },
  { company_name: 'HiBid', website_url: 'https://www.hibid.com', contact_email: null, inventory_type: 'Multi-category auctions via Auction Flex', geographic_coverage: 'North America' },
  { company_name: 'GovDeals', website_url: 'https://www.govdeals.com', contact_email: null, inventory_type: 'Government surplus equipment', geographic_coverage: 'United States' },
  { company_name: 'GSA Auctions', website_url: 'https://gsaauctions.gov', contact_email: null, inventory_type: 'Federal surplus equipment', geographic_coverage: 'United States' },
  // Tier 2
  { company_name: 'Steffes Group', website_url: 'https://www.steffesgroup.com', contact_email: null, inventory_type: 'Farm equipment auctions', geographic_coverage: 'Midwest US' },
  { company_name: 'Miedema Asset Management (1800LastBid)', website_url: 'https://www.1800lastbid.com', contact_email: null, inventory_type: 'Farm equipment auctions', geographic_coverage: 'Midwest US' },
  { company_name: 'Sullivan Auctioneers', website_url: 'https://www.sullivanauctioneers.com', contact_email: null, inventory_type: 'Farm and construction auctions', geographic_coverage: 'Midwest US' },
  { company_name: 'Wieman Land & Auction', website_url: 'https://www.wiemanauction.com', contact_email: null, inventory_type: 'Farm equipment and land', geographic_coverage: 'Midwest US' },
  { company_name: 'Aumann Auctions', website_url: 'https://www.aumannauctions.com', contact_email: null, inventory_type: 'Farm equipment auctions', geographic_coverage: 'Midwest and International' },
  { company_name: 'Schrader Real Estate & Auction', website_url: 'https://www.schraderauction.com', contact_email: null, inventory_type: 'Farm equipment and real estate', geographic_coverage: 'Midwest US' },
  { company_name: 'Merit Auctions', website_url: 'https://www.meritauctions.com', contact_email: null, inventory_type: 'Agricultural equipment', geographic_coverage: 'Regional US' },
  { company_name: 'Mowrey Auction Company', website_url: 'https://www.mowreyauction.com', contact_email: null, inventory_type: 'Farm and equipment auctions', geographic_coverage: 'Regional US' },
  { company_name: 'Yoder & Frey', website_url: 'https://www.yoderandfrey.com', contact_email: null, inventory_type: 'Farm equipment auctions', geographic_coverage: 'Ohio / Midwest' },
  { company_name: 'Hansen Auction Group', website_url: 'https://www.hansenauctiongroup.com', contact_email: null, inventory_type: 'Agricultural equipment', geographic_coverage: 'Regional US' },
  { company_name: 'Zomer Company Realty & Auction', website_url: 'https://www.zomercompany.com', contact_email: null, inventory_type: 'Farm equipment and real estate', geographic_coverage: 'Iowa / Midwest' },
  { company_name: "Pifer's Auction & Realty", website_url: 'https://www.pifers.com', contact_email: null, inventory_type: 'Farm equipment and land', geographic_coverage: 'Northern Plains' },
  { company_name: 'Witcher Auctions', website_url: 'https://www.witcherauctions.com', contact_email: null, inventory_type: 'Agricultural equipment', geographic_coverage: 'Regional US' },
  // Tier 3
  { company_name: 'Maring Auction Company', website_url: 'https://www.maringauction.com', contact_email: null, inventory_type: 'Farm equipment', geographic_coverage: 'Regional US' },
  { company_name: 'Kramer Auction Service', website_url: 'https://www.kramerauction.com', contact_email: null, inventory_type: 'Farm equipment', geographic_coverage: 'Regional US' },
  { company_name: 'Girard Auction & Land Brokers', website_url: 'https://www.girardauction.com', contact_email: null, inventory_type: 'Farm equipment and land', geographic_coverage: 'Regional US' },
  { company_name: 'McGrew Equipment Auctions', website_url: 'https://www.mcgrewonlineauctions.com', contact_email: null, inventory_type: 'Agricultural equipment', geographic_coverage: 'Regional US' },
  { company_name: 'Vanderbrink Auctions', website_url: 'https://www.vanderbrinkauctions.com', contact_email: null, inventory_type: 'Farm equipment and real estate', geographic_coverage: 'Iowa / Midwest' },
  // Tier 4 Government
  { company_name: 'Public Surplus', website_url: 'https://www.publicsurplus.com', contact_email: null, inventory_type: 'Government surplus equipment', geographic_coverage: 'United States' },
  { company_name: 'Municibid', website_url: 'https://www.municibid.com', contact_email: null, inventory_type: 'Municipal surplus equipment', geographic_coverage: 'United States' },
  // Tier 5 Software Providers
  { company_name: 'Wavebid', website_url: 'https://wavebid.com', contact_email: null, inventory_type: 'Auction software platform', geographic_coverage: 'North America' },
  { company_name: 'BidJS', website_url: 'https://bidjs.com', contact_email: null, inventory_type: 'Auction software platform', geographic_coverage: 'Global' },
  { company_name: 'Auction Mobility', website_url: 'https://www.auctionmobility.com', contact_email: null, inventory_type: 'White-label auction platform', geographic_coverage: 'Global' },
]

export async function seedOutreachContacts() {
  const supabase = createClient()
  const { error } = await supabase
    .from('outreach_contacts')
    .upsert(companies, { onConflict: 'company_name' })
  if (error) console.error('Seed error:', error)
  else console.log(`Seeded ${companies.length} outreach contacts`)
}
```

---

## How the Agent Picks the Right Template

Add this logic to `lib/outreach/generate-email.ts`:

```ts
function getCompanyTier(company: OutreachContact): string {
  const tier1 = ['EquipmentFacts','AuctionTime','BigIron','Purple Wave','Ritchie Bros','IronPlanet','BidSpotter','Proxibid','HiBid','GovDeals','GSA Auctions']
  const softwareProviders = ['Wavebid','BidJS','Auction Mobility','HiBid']

  if (softwareProviders.some(s => company.company_name.includes(s))) return 'software_provider'
  if (tier1.some(s => company.company_name.includes(s))) return 'tier1'
  if (company.geographic_coverage?.includes('Government') || company.inventory_type?.includes('Government')) return 'government'
  return 'regional'
}
```

Pass the tier into the Claude prompt so it selects the right angle and template automatically.
