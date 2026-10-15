import { formatCurrency, formatDate } from "@/lib/format"
import { SITE_URL } from "@/lib/seo/slug"
import type { Listing } from "@/types"

export type AlertEmail = { subject: string; text: string; html: string }

function listingLine(listing: Listing): string {
  const title = listing.title ?? [listing.year, listing.make, listing.model].filter(Boolean).join(" ")
  const price = formatCurrency(listing.current_bid)
  const ends = formatDate(listing.auction_end_date)
  const parts = [price, ends ? `ends ${ends}` : null].filter(Boolean).join(" · ")
  return `${title}${parts ? ` — ${parts}` : ""}\n${SITE_URL}/listing/${listing.id}`
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function listingTitle(listing: Listing): string {
  return listing.title ?? ([listing.year, listing.make, listing.model].filter(Boolean).join(" ") || "Listing")
}

/** One listing as an email-safe table row: photo, title, bid, end date, source. */
function listingCardHtml(listing: Listing): string {
  const url = `${SITE_URL}/listing/${listing.id}`
  const title = escapeHtml(listingTitle(listing))
  const image = listing.images?.[0]
  const price = formatCurrency(listing.current_bid)
  const ends = formatDate(listing.auction_end_date)
  const location = [listing.location_city, listing.location_state].filter(Boolean).join(", ")
  const source = listing.source?.name ?? listing.auction_company
  const details = [
    price ? `Current bid <strong style="color:#1a1d1e">${escapeHtml(price)}</strong>` : null,
    ends ? `Ends ${escapeHtml(ends)}` : null,
    location ? escapeHtml(location) : null,
  ]
    .filter(Boolean)
    .join(" &middot; ")

  const photo = image
    ? `<img src="${escapeHtml(image)}" width="120" height="90" alt="" style="display:block;width:120px;height:90px;object-fit:cover;border-radius:6px;border:0">`
    : `<div style="width:120px;height:90px;border-radius:6px;background:#e7ebe5;color:#4a6741;font-size:12px;line-height:90px;text-align:center">No photo</div>`

  return `<tr><td style="padding:12px 0;border-bottom:1px solid #e5e7eb">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr>
<td width="120" valign="top"><a href="${url}" style="text-decoration:none">${photo}</a></td>
<td valign="top" style="padding-left:14px">
<a href="${url}" style="color:#1a1d1e;font-size:16px;font-weight:600;text-decoration:none">${title}</a>
<div style="margin-top:4px;color:#4b5563;font-size:14px;line-height:20px">${details}</div>
${source ? `<div style="margin-top:4px;color:#6b7280;font-size:12px">Listed on ${escapeHtml(source)}</div>` : ""}
<a href="${url}" style="display:inline-block;margin-top:8px;color:#4a6741;font-size:14px;font-weight:600;text-decoration:none">View listing &rarr;</a>
</td></tr></table>
</td></tr>`
}

/** Shared branded shell around an alert's content. */
function layoutHtml({
  heading,
  intro,
  listings,
  cta,
  unsubscribeUrl,
}: {
  heading: string
  intro: string
  listings: Listing[]
  cta: { label: string; url: string }
  unsubscribeUrl: string
}): string {
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f3f4f2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f3f4f2;padding:24px 12px"><tr><td align="center">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;background:#ffffff;border-radius:10px;overflow:hidden">
<tr><td style="background:#1a1d1e;padding:18px 24px">
<a href="${SITE_URL}" style="color:#ffffff;font-size:20px;font-weight:700;text-decoration:none;letter-spacing:0.5px">TRACTOR<span style="color:#7fb573">AUCTION</span>.com</a>
</td></tr>
<tr><td style="padding:24px 24px 8px">
<h1 style="margin:0;color:#1a1d1e;font-size:22px;line-height:28px">${escapeHtml(heading)}</h1>
<p style="margin:8px 0 0;color:#4b5563;font-size:15px;line-height:22px">${escapeHtml(intro)}</p>
</td></tr>
<tr><td style="padding:0 24px">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%">${listings.map(listingCardHtml).join("")}</table>
</td></tr>
<tr><td style="padding:20px 24px 28px">
<a href="${cta.url}" style="display:inline-block;background:#4a6741;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:12px 20px;border-radius:8px">${escapeHtml(cta.label)}</a>
</td></tr>
<tr><td style="background:#f9fafb;padding:16px 24px;color:#6b7280;font-size:12px;line-height:18px">
You're getting this because you set up an alert on TractorAuction.com. Bidding happens on the original auction site.<br>
<a href="${unsubscribeUrl}" style="color:#6b7280">Turn off all email alerts</a>
</td></tr>
</table>
</td></tr></table>
</body></html>`
}

function footer(unsubscribeUrl: string): string {
  return [
    "",
    "—",
    "You're getting this because you set up an alert on TractorAuction.com.",
    `Turn off all email alerts: ${unsubscribeUrl}`,
  ].join("\n")
}

/** New listings matching a saved search since it was last checked. */
export function savedSearchMatchesEmail({
  searchName,
  searchPath,
  listings,
  unsubscribeUrl,
}: {
  searchName: string
  /** "/search?make=..." for this saved search, so "See all" reopens it. */
  searchPath: string
  listings: Listing[]
  unsubscribeUrl: string
}): AlertEmail {
  const subject =
    listings.length === 1
      ? `1 new match for "${searchName}"`
      : `${listings.length} new matches for "${searchName}"`

  const body = [
    `New listings matching your saved search "${searchName}":`,
    "",
    listings.map(listingLine).join("\n\n"),
    "",
    `See all matches: ${SITE_URL}${searchPath}`,
    footer(unsubscribeUrl),
  ].join("\n")

  const html = layoutHtml({
    heading: subject,
    intro: `New listings matching your saved search "${searchName}".`,
    listings,
    cta: { label: "See all matches", url: `${SITE_URL}${searchPath}` },
    unsubscribeUrl,
  })

  return { subject, text: body, html }
}

/** A watchlisted listing's auction closes within 24 hours. */
export function endingSoonEmail({
  listings,
  unsubscribeUrl,
}: {
  listings: Listing[]
  unsubscribeUrl: string
}): AlertEmail {
  const subject =
    listings.length === 1
      ? "A tractor on your watchlist ends in 24 hours"
      : `${listings.length} tractors on your watchlist end within 24 hours`

  const body = [
    "These watchlisted auctions are ending soon:",
    "",
    listings.map(listingLine).join("\n\n"),
    "",
    `View your watchlist: ${SITE_URL}/account/watchlist`,
    footer(unsubscribeUrl),
  ].join("\n")

  const html = layoutHtml({
    heading: subject,
    intro: "Bidding closes within 24 hours. Place your bid on the original auction site before time runs out.",
    listings,
    cta: { label: "View your watchlist", url: `${SITE_URL}/account/watchlist` },
    unsubscribeUrl,
  })

  return { subject, text: body, html }
}
