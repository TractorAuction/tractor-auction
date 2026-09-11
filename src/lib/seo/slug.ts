/**
 * Slugs are derived from the data rather than stored, so a landing page URL is
 * a pure function of the make/model/state it represents. Matching back is done
 * case-insensitively against the real column value, which keeps "Case IH" and
 * "case-ih" pointing at the same page without a lookup table.
 */
export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

/** Finds the real, correctly-cased value whose slug matches. */
export function matchSlug(slug: string, candidates: string[]): string | undefined {
  const target = slugify(slug)
  return candidates.find((candidate) => slugify(candidate) === target)
}

export const US_STATES: Record<string, string> = {
  AL: "Alabama",
  AK: "Alaska",
  AZ: "Arizona",
  AR: "Arkansas",
  CA: "California",
  CO: "Colorado",
  CT: "Connecticut",
  DE: "Delaware",
  FL: "Florida",
  GA: "Georgia",
  HI: "Hawaii",
  ID: "Idaho",
  IL: "Illinois",
  IN: "Indiana",
  IA: "Iowa",
  KS: "Kansas",
  KY: "Kentucky",
  LA: "Louisiana",
  ME: "Maine",
  MD: "Maryland",
  MA: "Massachusetts",
  MI: "Michigan",
  MN: "Minnesota",
  MS: "Mississippi",
  MO: "Missouri",
  MT: "Montana",
  NE: "Nebraska",
  NV: "Nevada",
  NH: "New Hampshire",
  NJ: "New Jersey",
  NM: "New Mexico",
  NY: "New York",
  NC: "North Carolina",
  ND: "North Dakota",
  OH: "Ohio",
  OK: "Oklahoma",
  OR: "Oregon",
  PA: "Pennsylvania",
  RI: "Rhode Island",
  SC: "South Carolina",
  SD: "South Dakota",
  TN: "Tennessee",
  TX: "Texas",
  UT: "Utah",
  VT: "Vermont",
  VA: "Virginia",
  WA: "Washington",
  WV: "West Virginia",
  WI: "Wisconsin",
  WY: "Wyoming",
}

export function stateName(code?: string) {
  if (!code) return undefined
  return US_STATES[code.toUpperCase()] ?? code
}

/** "north-dakota" or "nd" -> "ND" */
export function stateCodeFromSlug(slug: string): string | undefined {
  const target = slugify(slug)

  if (target.length === 2 && US_STATES[target.toUpperCase()]) {
    return target.toUpperCase()
  }

  const entry = Object.entries(US_STATES).find(([, name]) => slugify(name) === target)
  return entry?.[0]
}

export const EQUIPMENT_CATEGORIES = [
  { slug: "tractor", label: "Tractors", value: "tractor" },
  { slug: "combine", label: "Combines", value: "combine" },
  { slug: "planter", label: "Planters", value: "planter" },
  { slug: "sprayer", label: "Sprayers", value: "sprayer" },
  { slug: "tillage", label: "Tillage Equipment", value: "tillage" },
  { slug: "hay-forage", label: "Hay & Forage", value: "hay-forage" },
  { slug: "skid-steer", label: "Skid Steers", value: "skid-steer" },
]

export function findCategory(slug: string) {
  const target = slugify(slug)
  return EQUIPMENT_CATEGORIES.find((category) => category.slug === target)
}

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "https://www.tractorauction.com"
