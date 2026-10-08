// Partner Center end-to-end QA (V1 item 15), run against a local dev server
// that shares the production database. Creates throwaway users/partner/listing
// on example.com addresses and deletes all of them in the finally block.
//   pnpm dev --port 3100 & node --env-file=.env.local scripts/qa-partner.mjs

import { createClient } from "@supabase/supabase-js"
import { Meilisearch } from "meilisearch"
import { randomBytes } from "node:crypto"
const BASE = "http://localhost:3100"
const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL, ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const ref = new URL(URL_).hostname.split(".")[0]
const svc = createClient(URL_, process.env.SUPABASE_SERVICE_ROLE_KEY)
const ok = (c, m) => console.log((c ? "PASS " : "FAIL ") + m)
const stamp = Date.now()
const created = { users: [], partner: null, source: null, submission: null, listing: null }

async function makeUser(tag, role) {
  const email = `qa-${tag}-${stamp}@example.com`, password = "Qa-" + randomBytes(9).toString("base64url")
  const { data, error } = await svc.auth.admin.createUser({ email, password, email_confirm: true })
  if (error) throw error
  created.users.push(data.user.id)
  if (role) await svc.from("profiles").update({ role }).eq("id", data.user.id)
  const c = createClient(URL_, ANON, { auth: { persistSession: false } })
  const { data: auth } = await c.auth.signInWithPassword({ email, password })
  const val = "base64-" + Buffer.from(JSON.stringify(auth.session)).toString("base64url")
  const chunks = val.match(/.{1,3180}/g)
  const cookie = chunks.length === 1 ? `sb-${ref}-auth-token=${val}` : chunks.map((ch, i) => `sb-${ref}-auth-token.${i}=${ch}`).join("; ")
  return { id: data.user.id, email, cookie }
}
const get = async (path, cookie) => (await fetch(BASE + path, { headers: { cookie } })).text()
/** Submits a server-action <form> found in `html` the way a no-JS browser would. */
async function submitForm(path, html, cookie, matches, fields = {}) {
  const forms = html.split("<form").slice(1).map(f => f.slice(0, f.indexOf("</form>")))
  const form = forms.find(matches)
  if (!form) throw new Error("form not found on " + path)
  const fd = new FormData()
  for (const m of form.matchAll(/<input[^>]*type="hidden"[^>]*>/g)) {
    const name = m[0].match(/name="([^"]+)"/)?.[1]; const value = m[0].match(/value="([^"]*)"/)?.[1] ?? ""
    if (name) fd.set(name, value.replace(/&amp;/g, "&"))
  }
  for (const [k, v] of Object.entries(fields)) fd.set(k, v)
  const r = await fetch(BASE + path, { method: "POST", body: fd, headers: { cookie }, redirect: "manual" })
  return r
}

try {
  // 1. application (public API, no account)
  const partnerEmail = `qa-partner-${stamp}@example.com`
  const app = await fetch(BASE + "/api/partner-submit", { method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ company_name: "QA Test Auctions " + stamp, contact_email: partnerEmail, contact_name: "QA", website_url: "https://example.com", feed_type: "manual", feed_url: "https://example.com/feed.xml" }) })
  ok(app.status === 201, "partner application submitted")
  const { data: p } = await svc.from("partners").select("*").eq("contact_email", partnerEmail).single()
  created.partner = p.id
  ok(p.feed_type === "manual" && p.feed_url && p.website_url && p.status === "pending", "application captures company, contact, website, feed type, feed URL")

  // 2. partner signs up with that email -> dashboard links the record
  const partnerUser = await makeUser("partner")
  await svc.auth.admin.updateUserById(partnerUser.id, { email: partnerEmail, email_confirm: true })
  const pu = createClient(URL_, ANON, { auth: { persistSession: false } })
  // re-login under the new email to get a session carrying it
  const { data: u2 } = await svc.auth.admin.getUserById(partnerUser.id)
  const pw = "Qa-" + randomBytes(9).toString("base64url")
  await svc.auth.admin.updateUserById(partnerUser.id, { password: pw })
  const { data: auth2 } = await pu.auth.signInWithPassword({ email: u2.user.email, password: pw })
  const val = "base64-" + Buffer.from(JSON.stringify(auth2.session)).toString("base64url")
  const ch = val.match(/.{1,3180}/g)
  partnerUser.cookie = ch.length === 1 ? `sb-${ref}-auth-token=${val}` : ch.map((c, i) => `sb-${ref}-auth-token.${i}=${c}`).join("; ")
  let dash = await get("/partner/dashboard", partnerUser.cookie)
  ok(dash.includes("QA Test Auctions " + stamp) && dash.includes("under review"), "partner dashboard links application by email (pending state)")
  const { data: linked } = await svc.from("partners").select("user_id").eq("id", p.id).single()
  ok(linked.user_id === partnerUser.id, "partner record now linked to the account")
  ok(!dash.includes('name="original_url"'), "listing form hidden until approved")

  // 3. admin approves (real admin action through the admin page form)
  const adminUser = await makeUser("admin", "admin")
  let adminHtml = await get("/admin/partners", adminUser.cookie)
  ok(adminHtml.includes("QA Test Auctions " + stamp), "admin sees the application")
  await submitForm("/admin/partners", adminHtml, adminUser.cookie, f => f.includes(`value="${p.id}"`) && f.includes(">Approve<"))
  const { data: p2 } = await svc.from("partners").select("status,source_id").eq("id", p.id).single()
  created.source = p2.source_id
  ok(p2.status === "approved" && p2.source_id, "admin approve -> approved + auction source created")
  adminHtml = await get("/admin/partners", adminUser.cookie)
  await submitForm("/admin/partners", adminHtml, adminUser.cookie, f => f.includes(`value="${p.id}"`) && f.includes("Mark pending"))
  ok((await svc.from("partners").select("status").eq("id", p.id).single()).data.status === "pending", "admin can mark as pending")
  await svc.from("partners").update({ status: "approved" }).eq("id", p.id)

  // 4. partner submits a manual listing through the dashboard form
  dash = await get("/partner/dashboard", partnerUser.cookie)
  ok(dash.includes('name="original_url"'), "listing form shown once approved")
  const end = new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 16)
  const r = await submitForm("/partner/dashboard", dash, partnerUser.cookie, f => f.includes('name="original_url"'),
    { title: "QA 2014 John Deere 5085E Tractor", original_url: "https://example.com/lot/qa-" + stamp, make: "john deere", model: "5085E", year: "2014", hours: "1820", location_state: "IA", location_city: "Ames", auction_end_date: end, current_bid: "21500", equipment_category: "" })
  const { data: sub } = await svc.from("partner_submissions").select("*").eq("partner_id", p.id).single()
  created.submission = sub?.id
  ok(sub && sub.status === "pending" && sub.make === "John Deere" && sub.equipment_category === "tractor", "partner manual listing saved for review (make canonicalized, category detected)")
  const { count: notPublic } = await svc.from("listings").select("id", { count: "exact", head: true }).eq("source_id", p2.source_id)
  ok(notPublic === 0, "submission is not public before review")

  // 5. admin approves the submission -> live listing
  adminHtml = await get("/admin/partners", adminUser.cookie)
  ok(adminHtml.includes("QA 2014 John Deere 5085E Tractor"), "admin review queue shows the submission")
  await submitForm("/admin/partners", adminHtml, adminUser.cookie, f => f.includes(`value="${sub.id}"`) && f.includes("Approve &amp; publish"))
  const { data: s2 } = await svc.from("partner_submissions").select("status,listing_id").eq("id", sub.id).single()
  created.listing = s2.listing_id
  const { data: lst } = await svc.from("listings").select("status,source_id,original_url").eq("id", s2.listing_id ?? "00000000-0000-0000-0000-000000000000").maybeSingle()
  ok(s2.status === "approved" && lst?.status === "active" && lst.source_id === p2.source_id, "approve & publish creates an active listing under the partner source")
  const { data: src } = await svc.from("auction_sources").select("status").eq("id", p2.source_id).single()
  ok(src.status === "active", "partner source goes live with first approved listing")
  const search = await (await fetch(BASE + "/api/search?q=5085E")).json()
  ok(search.data.listings.some(l => l.id === s2.listing_id), "published listing appears in search")

  // 6. analytics: a click on the listing shows on the partner dashboard
  const click = await fetch(BASE + "/api/click?listingId=" + s2.listing_id, { redirect: "manual" })
  ok(click.headers.get("location") === lst.original_url, "outbound click goes to the partner's own listing page")
  await new Promise(res => setTimeout(res, 1000))
  dash = await get("/partner/dashboard", partnerUser.cookie)
  ok(/Clicks, 30 days<\/dt><dd[^>]*>1</.test(dash) && dash.includes("QA 2014 John Deere 5085E Tractor"), "partner dashboard shows clicks per listing")
  // a different partner must not see these numbers
  const stranger = await makeUser("stranger")
  const sd = await get("/partner/dashboard", stranger.cookie)
  ok(sd.includes("No partner account yet") && !sd.includes("QA Test Auctions"), "other accounts cannot see this partner's dashboard")
} finally {
  if (created.listing) {
    await svc.from("click_events").delete().eq("listing_id", created.listing)
    await svc.from("partner_submissions").delete().eq("id", created.submission)
    await svc.from("listings").delete().eq("id", created.listing)
    try { await new Meilisearch({ host: process.env.MEILISEARCH_HOST, apiKey: process.env.MEILISEARCH_API_KEY }).index("listings").deleteDocuments([created.listing]).waitTask() } catch {}
  } else if (created.submission) await svc.from("partner_submissions").delete().eq("id", created.submission)
  if (created.partner) await svc.from("partners").delete().eq("id", created.partner)
  if (created.source) await svc.from("auction_sources").delete().eq("id", created.source)
  for (const id of created.users) { await svc.from("profiles").delete().eq("id", id); await svc.auth.admin.deleteUser(id) }
  console.log("cleanup done:", JSON.stringify({ users: created.users.length, partner: !!created.partner, source: !!created.source, listing: !!created.listing }))
}
