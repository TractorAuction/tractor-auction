import type { MetadataRoute } from "next"

import { EQUIPMENT_CATEGORIES, SITE_URL, slugify, stateName } from "@/lib/seo/slug"
import { createPublicClient } from "@/lib/supabase/public"

// Google caps a single sitemap at 50,000 URLs. Listings churn constantly, so
// only active ones are included and the cap is applied to them.
const MAX_LISTINGS = 20000

// Regenerated hourly rather than per request — a crawler hitting this should
// not cost a database round trip each time.
export const revalidate = 3600

type Row = Record<string, unknown>

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "hourly", priority: 1 },
    { url: `${SITE_URL}/search`, lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    { url: `${SITE_URL}/partner`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    {
      url: `${SITE_URL}/partner/register`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    ...EQUIPMENT_CATEGORIES.map((category) => ({
      url: `${SITE_URL}/category/${category.slug}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
  ]

  try {
    const supabase = createPublicClient()

    const { data, error } = await supabase
      .from("listings")
      .select("id, make, model, location_state, updated_at, created_at")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(MAX_LISTINGS)

    if (error) throw new Error(error.message)

    const makes = new Set<string>()
    const modelPairs = new Set<string>()
    const states = new Set<string>()
    const listingRoutes: MetadataRoute.Sitemap = []

    for (const row of data ?? []) {
      const record = row as Row
      const make = record.make as string | null
      const model = record.model as string | null
      const state = record.location_state as string | null

      if (make) makes.add(make)
      if (make && model) modelPairs.add(`${slugify(make)}/${slugify(model)}`)
      if (state) states.add(state)

      listingRoutes.push({
        url: `${SITE_URL}/listing/${record.id as string}`,
        lastModified: new Date((record.updated_at ?? record.created_at) as string),
        changeFrequency: "daily",
        priority: 0.6,
      })
    }

    return [
      ...staticRoutes,
      ...Array.from(makes).map((make) => ({
        url: `${SITE_URL}/brand/${slugify(make)}`,
        lastModified: now,
        changeFrequency: "daily" as const,
        priority: 0.8,
      })),
      ...Array.from(modelPairs).map((pair) => ({
        url: `${SITE_URL}/brand/${pair}`,
        lastModified: now,
        changeFrequency: "daily" as const,
        priority: 0.7,
      })),
      ...Array.from(states).map((state) => ({
        url: `${SITE_URL}/location/${slugify(stateName(state) ?? state)}`,
        lastModified: now,
        changeFrequency: "daily" as const,
        priority: 0.7,
      })),
      ...listingRoutes,
    ]
  } catch (error) {
    // A database hiccup should degrade the sitemap, not break the build.
    console.error("[sitemap]", error)
    return staticRoutes
  }
}
