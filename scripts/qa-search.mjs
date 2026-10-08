// Search and filter QA (V1 item 10). Checks every filter, sort and page of
// /api/search against the same predicate applied directly to Postgres.
//   node --env-file=.env.local scripts/qa-search.mjs
//   QA_BASE=http://localhost:3000 node --env-file=.env.local scripts/qa-search.mjs

import { createClient } from "@supabase/supabase-js"
const BASE = process.env.QA_BASE ?? "https://www.tractorauction.com"
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const now = Date.now()
const { data: all } = await s.from("listings").select("*").eq("status", "active")
const live = all.filter(l => !l.auction_end_date || new Date(l.auction_end_date).getTime() >= now)
const num = v => v === null || v === undefined ? null : Number(v)
const sample = live.find(l => l.make && l.model) ?? live[0]
const state = live.find(l => l.location_state)?.location_state
const bids = live.map(l => num(l.current_bid)).filter(v => v !== null).sort((a, b) => a - b)
const mid = bids[Math.floor(bids.length / 2)] ?? 1000
const in3days = new Date(now + 3 * 86400000).toISOString()
const cases = [
  ["no filters", {}, () => true],
  ["make", { make: sample.make }, l => l.make?.toLowerCase() === sample.make.toLowerCase()],
  ["model", { make: sample.make, model: sample.model }, l => l.make?.toLowerCase() === sample.make.toLowerCase() && l.model?.toLowerCase() === sample.model.toLowerCase()],
  ["year range", { year_min: 2000, year_max: 2015 }, l => num(l.year) !== null && l.year >= 2000 && l.year <= 2015],
  ["hours max", { hours_max: 2000 }, l => num(l.hours) !== null && l.hours <= 2000],
  ["hp range", { hp_min: 50, hp_max: 200 }, l => num(l.horsepower) !== null && l.horsepower >= 50 && l.horsepower <= 200],
  ["state", { state }, l => l.location_state === state],
  ["source", { source: sample.source_id }, l => l.source_id === sample.source_id],
  ["price range", { price_min: 1, price_max: mid }, l => num(l.current_bid) !== null && l.current_bid >= 1 && l.current_bid <= mid],
  ["ending before", { ending_before: in3days }, l => l.auction_end_date && l.auction_end_date <= in3days],
  ["category tractor", { category: "tractor" }, l => l.equipment_category === "tractor"],
  ["category construction", { category: "construction" }, l => l.equipment_category === "construction"],
  ["query 'tractors' -> category", { q: "tractors" }, l => l.equipment_category === "tractor"],
  ["combined: make+state+hours", { make: "John Deere", state, hours_max: 2000 }, l => l.make === "John Deere" && l.location_state === state && num(l.hours) !== null && l.hours <= 2000],
  ["combined: tractor+make+price", { category: "tractor", make: "John Deere", price_max: mid }, l => l.equipment_category === "tractor" && l.make === "John Deere" && num(l.current_bid) !== null && l.current_bid <= mid],
]
let fails = 0
const get = async (p) => { const r = await fetch(BASE + "/api/search?" + new URLSearchParams({ pageSize: "100", ...p })); return (await r.json()).data }
for (const [name, params, pred] of cases) {
  const d = await get(params)
  const expected = live.filter(pred)
  const bad = d.listings.filter(l => !expected.some(e => e.id === l.id))
  const ok = bad.length === 0 && d.total === expected.length && d.listings.length === expected.length
  if (!ok) fails++
  console.log(`${ok ? "PASS" : "FAIL"}  ${name.padEnd(30)} api=${d.total} rows=${d.listings.length} expected=${expected.length}${bad.length ? " wrong=" + bad.map(b => b.title).join("; ") : ""}`)
}
// sorting
const key = { ending_soon: l => l.auction_end_date && new Date(l.auction_end_date).getTime(), recently_added: l => new Date(l.created_at).getTime(), price_asc: l => num(l.current_bid), price_desc: l => num(l.current_bid) }
for (const [sort, asc] of [["ending_soon", true], ["recently_added", false], ["price_asc", true], ["price_desc", false]]) {
  const d = await get({ sort })
  const vals = d.listings.map(key[sort]).filter(v => v !== null && v !== undefined)
  const ordered = vals.every((v, i) => i === 0 || (asc ? vals[i - 1] <= v : vals[i - 1] >= v))
  const nullsLast = d.listings.map(key[sort]).findIndex(v => v === null || v === undefined)
  const nl = nullsLast === -1 || d.listings.slice(nullsLast).every(l => key[sort](l) === null || key[sort](l) === undefined)
  if (!(ordered && nl)) fails++
  console.log(`${ordered && nl ? "PASS" : "FAIL"}  sort ${sort.padEnd(25)} ordered=${ordered} nullsLast=${nl}`)
}
// pagination
const size = 5, total = live.length, pages = Math.ceil(total / size), seen = new Set()
let pagOk = true
for (let p = 1; p <= pages + 1; p++) {
  const r = await fetch(BASE + `/api/search?pageSize=${size}&page=${p}&sort=recently_added`); const d = (await r.json()).data
  if (p <= pages && d.listings.length !== Math.min(size, total - (p - 1) * size)) pagOk = false
  if (p > pages && d.listings.length !== 0) pagOk = false
  for (const l of d.listings) { if (seen.has(l.id)) pagOk = false; seen.add(l.id) }
}
if (seen.size !== total) pagOk = false
if (!pagOk) fails++
console.log(`${pagOk ? "PASS" : "FAIL"}  pagination ${pages} pages of ${size}, unique=${seen.size}/${total}, past-last empty`)
console.log(`\n${fails} failure(s)`)
