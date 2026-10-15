"use client"

import Image, { type ImageProps } from "next/image"
import { useState } from "react"

import { ListingImagePlaceholder } from "./listing-image-placeholder"

/**
 * A hot-linked source photo. Auction sites move, expire or block their images,
 * and a dead one would otherwise render as a broken-image box; this falls back
 * to the same silhouette shown when a feed carries no photo at all.
 */
export function ListingPhoto({
  category,
  iconClassName,
  ...props
}: ImageProps & { category?: string; iconClassName?: string }) {
  const [failedSrc, setFailedSrc] = useState<ImageProps["src"] | null>(null)

  if (failedSrc === props.src) {
    return <ListingImagePlaceholder category={category} iconClassName={iconClassName} />
  }

  // eslint-disable-next-line jsx-a11y/alt-text -- alt is passed through in props
  return <Image {...props} onError={() => setFailedSrc(props.src)} />
}
