import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { CompareBar } from "@/components/listing/compare-bar";
import { CompareProvider } from "@/components/listing/compare-context";

import "./globals.css";
import { SITE_URL } from "@/lib/seo/slug"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // Resolves every relative canonical/OG URL in the app to an absolute one;
  // search engines treat a relative canonical as unreliable.
  metadataBase: new URL(SITE_URL),
  title: "TractorAuction.com — Search Tractor Auctions in One Place",
  description:
    "Search and compare tractor and ag equipment auctions from multiple auction sites in one place.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <CompareProvider>
          <Header />
          {children}
          <Footer />
          <CompareBar />
        </CompareProvider>
      </body>
    </html>
  );
}
