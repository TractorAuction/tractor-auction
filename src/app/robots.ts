import type { MetadataRoute } from "next"

import { SITE_URL } from "@/lib/seo/slug"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // /api/click is an outbound redirect and /search has infinite filter
        // permutations — neither should burn crawl budget.
        disallow: ["/admin", "/api/", "/account", "/partner/dashboard", "/search?"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
