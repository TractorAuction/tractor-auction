import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Listing photos are hot-linked from third party auction sites, so the host
    // set is open ended. Narrow this to per-source hostnames once ingestion is live.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
