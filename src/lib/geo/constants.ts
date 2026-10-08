/**
 * The client-safe half of lib/geo. Kept apart from zip.ts so that importing a
 * radius option or the ZIP validator in a client component never pulls the
 * 800 KB centroid table into the browser bundle.
 */

/** Radius choices offered in the UI, in miles. Nationwide = no radius. */
export const RADIUS_OPTIONS = [50, 100, 250, 500] as const

/** Accepts "50309", "50309-1234" or " 50309 "; anything else is undefined. */
export function normalizeZip(value: string | undefined | null): string | undefined {
  const match = value?.trim().match(/^(\d{5})(?:-\d{4})?$/)
  return match?.[1]
}
