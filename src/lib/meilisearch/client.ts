import { Meilisearch } from "meilisearch"

export const meilisearch = new Meilisearch({
  host: process.env.MEILISEARCH_HOST!,
  apiKey: process.env.MEILISEARCH_API_KEY,
})

export const LISTINGS_INDEX = "listings"
