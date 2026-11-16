import { createAdminClient } from "@/lib/supabase/admin"

import { INGEST_USER_AGENT } from "./fetch"

/**
 * Copies source photos into our own storage and returns our public URL.
 *
 * For sources whose image links are not public endpoints. GSA is the case
 * that needs it: its imageURL is an internal PPMS link that GSA says is not
 * meant to be hot-linked, but which we may "download and cache for your
 * purpose" (GSA Personal Property Branch, by email, Nov 2026).
 *
 * Each photo is stored once under a stable path (`<prefix>/<external id>`)
 * and never fetched again, so a re-sync costs one storage listing rather
 * than a download per lot. New downloads per run are capped and stop at the
 * deadline; anything left over is picked up by the next run, and until then
 * the listing shows its stock photo.
 */

export const LISTING_PHOTOS_BUCKET = "listing-photos"

const MAX_BYTES = 8 * 1024 * 1024
const MAX_NEW_PER_RUN = 40
const CONCURRENCY = 4
const DOWNLOAD_TIMEOUT_MS = 12_000
/** Stop starting downloads this close to the run deadline. */
const DEADLINE_MARGIN_MS = 8_000

export type ImageToCache = { externalId: string; url: string }

type Format = { ext: string; contentType: string }

/** GSA serves photos as application/octet-stream, so the type is read from
 *  the file's own first bytes rather than trusted from the header. */
function sniffFormat(bytes: Uint8Array): Format | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return { ext: "jpg", contentType: "image/jpeg" }
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47)
    return { ext: "png", contentType: "image/png" }
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) return { ext: "gif", contentType: "image/gif" }
  const riff = String.fromCharCode(...bytes.slice(0, 4))
  const webp = String.fromCharCode(...bytes.slice(8, 12))
  if (riff === "RIFF" && webp === "WEBP") return { ext: "webp", contentType: "image/webp" }
  return null
}

/** Storage keys allow a limited character set; GSA ids contain only safe ones,
 *  but a future source might not. */
function safeKey(externalId: string) {
  return externalId.replace(/[^A-Za-z0-9._-]/g, "_")
}

/**
 * Returns external id → public URL for every image that is cached, whether
 * it was stored on an earlier run or downloaded now. Never throws: a storage
 * or download failure leaves those listings on their stock photo and is
 * reported in `errors`.
 */
export async function cacheImages(
  prefix: string,
  images: ImageToCache[],
  { deadline }: { deadline: number }
): Promise<{ urls: Map<string, string>; downloaded: number; errors: string[] }> {
  const urls = new Map<string, string>()
  const errors: string[] = []
  if (images.length === 0) return { urls, downloaded: 0, errors }

  let storage: ReturnType<ReturnType<typeof createAdminClient>["storage"]["from"]>
  try {
    const supabase = createAdminClient()
    await ensureBucket(supabase)
    storage = supabase.storage.from(LISTING_PHOTOS_BUCKET)
  } catch (error) {
    return { urls, downloaded: 0, errors: [`photo storage unavailable: ${message(error)}`] }
  }

  const publicUrl = (path: string) => storage.getPublicUrl(path).data.publicUrl

  // What is already stored: one listing call instead of a check per lot.
  const stored = new Map<string, string>()
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await storage.list(prefix, { limit: 1000, offset })
    if (error) {
      errors.push(`could not list cached photos: ${error.message}`)
      break
    }
    for (const file of data ?? []) {
      stored.set(file.name.replace(/\.[a-z]+$/, ""), `${prefix}/${file.name}`)
    }
    if (!data || data.length < 1000) break
  }

  const pending: ImageToCache[] = []
  for (const image of images) {
    const path = stored.get(safeKey(image.externalId))
    if (path) urls.set(image.externalId, publicUrl(path))
    else pending.push(image)
  }

  const queue = pending.slice(0, MAX_NEW_PER_RUN)
  let downloaded = 0

  async function worker() {
    for (let next = queue.shift(); next; next = queue.shift()) {
      if (Date.now() > deadline - DEADLINE_MARGIN_MS) return
      try {
        const response = await fetch(next.url, {
          headers: { "user-agent": INGEST_USER_AGENT, accept: "image/*,*/*" },
          signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS),
        })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const bytes = new Uint8Array(await response.arrayBuffer())
        if (bytes.byteLength > MAX_BYTES) throw new Error(`too large (${bytes.byteLength} bytes)`)
        const format = sniffFormat(bytes)
        if (!format) throw new Error("not an image")

        const path = `${prefix}/${safeKey(next.externalId)}.${format.ext}`
        const { error } = await storage.upload(path, bytes, {
          contentType: format.contentType,
          cacheControl: "31536000",
          upsert: true,
        })
        if (error) throw new Error(`upload failed: ${error.message}`)

        urls.set(next.externalId, publicUrl(path))
        downloaded += 1
      } catch (error) {
        errors.push(`${next.externalId}: ${message(error)}`)
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker))
  return { urls, downloaded, errors }
}

/** Creates the public bucket on first use, so no manual dashboard step is needed. */
async function ensureBucket(supabase: ReturnType<typeof createAdminClient>) {
  const { data } = await supabase.storage.getBucket(LISTING_PHOTOS_BUCKET)
  if (data) return
  const { error } = await supabase.storage.createBucket(LISTING_PHOTOS_BUCKET, {
    public: true,
    fileSizeLimit: MAX_BYTES,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
  })
  if (error && !/already exists/i.test(error.message)) throw new Error(error.message)
}

function message(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}
