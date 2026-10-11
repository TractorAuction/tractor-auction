import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Listing photos are hot-linked from third party auction sites, so the host
    // set is open ended. Narrow this to per-source hostnames once ingestion is live.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  // The owner's Terms link to /privacy-policy; the pages live at /privacy and /terms.
  async redirects() {
    return [
      { source: "/privacy-policy", destination: "/privacy", permanent: true },
      { source: "/terms-and-conditions", destination: "/terms", permanent: true },
    ];
  },
};

export default nextConfig;
