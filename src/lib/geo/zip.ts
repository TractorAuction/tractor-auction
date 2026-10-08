import { normalizeZip } from "./constants"
import centroids from "./us-zip-centroids.json"

export { normalizeZip, RADIUS_OPTIONS } from "./constants"

export type LatLng = { lat: number; lng: number }

const MILES_TO_METERS = 1609.344
const EARTH_RADIUS_MILES = 3958.8

let table: Map<string, LatLng> | null = null

/**
 * ZIP → centroid from the bundled Census ZCTA file (public domain, ~33k ZIPs),
 * so neither ingestion nor a visitor's search depends on a paid or rate-limited
 * geocoding API. Parsed once per server instance, on first use.
 */
function zipTable(): Map<string, LatLng> {
  if (table) return table
  table = new Map()
  for (const line of centroids.zips.split("\n")) {
    const [zip, lat, lng] = line.split(",")
    table.set(zip, { lat: Number(lat), lng: Number(lng) })
  }
  return table
}

export function geocodeZip(value: string | undefined | null): LatLng | undefined {
  const zip = normalizeZip(value)
  return zip ? zipTable().get(zip) : undefined
}

export function milesToMeters(miles: number): number {
  return miles * MILES_TO_METERS
}

/** Great-circle distance in miles. */
export function distanceMiles(a: LatLng, b: LatLng): number {
  const rad = Math.PI / 180
  const dLat = (b.lat - a.lat) * rad
  const dLng = (b.lng - a.lng) * rad
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_MILES * Math.asin(Math.sqrt(h))
}

/** Lat/lng box enclosing a radius; the Postgres fallback filters on this. */
export function boundingBox(center: LatLng, miles: number) {
  const dLat = miles / 69
  const dLng = miles / (69 * Math.max(Math.cos((center.lat * Math.PI) / 180), 0.01))
  return {
    minLat: center.lat - dLat,
    maxLat: center.lat + dLat,
    minLng: center.lng - dLng,
    maxLng: center.lng + dLng,
  }
}
