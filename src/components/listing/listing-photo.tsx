"use client"

import Image, { type ImageProps } from "next/image"
import { useState } from "react"

import { ListingImagePlaceholder } from "./listing-image-placeholder"

/**
 * A hot-linked source photo. Auction sites move, expire or block their images,
 * and a dead one would otherwise render as a broken-image box; this falls back
 * to the same representative stock photo shown when a feed carries none.
 */
export function ListingPhoto({
  category,
  compact,
  ...props
}: ImageProps & { category?: string; compact?: boolean }) {
  const [failedSrc, setFailedSrc] = useState<ImageProps["src"] | null>(null)

  if (failedSrc === props.src) {
    return <ListingImagePlaceholder category={category} sizes={props.sizes} compact={compact} />
  }

  // eslint-disable-next-line jsx-a11y/alt-text -- alt is passed through in props
  return <Image {...props} onError={() => setFailedSrc(props.src)} />
}
