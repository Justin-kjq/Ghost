import type { Metadata } from "next";
import {
  Instrument_Sans,
  Instrument_Serif,
  Inter,
  JetBrains_Mono,
} from "next/font/google";
import { Providers } from "@/components/providers";
import { JsonLd } from "@/components/json-ld";
import { SITE_URL } from "@/lib/addresses";
import { AEO, siteGraphJsonLd } from "@/lib/aeo";
import "./globals.css";

const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-serif",
});

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const instrument = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument",
  axes: ["wdth"],
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

const siteDescription = AEO.description;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `Ghost | ${AEO.oneLiner.replace(/\.$/, "")}`,
    template: "%s · Ghost",
  },
  description: siteDescription,
  applicationName: AEO.name,
  authors: [{ name: AEO.legalName, url: SITE_URL }],
  creator: AEO.legalName,
  publisher: AEO.legalName,
  category: "finance",
  keywords: [
    "Ghost",
    "Ghost Gas",
    "Solana",
    "prepaid gas",
    "gasless",
    "USDC",
    "fee payer",
    "gas note",
    "wallet privacy",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: AEO.name,
    title: `Ghost | ${AEO.oneLiner.replace(/\.$/, "")}`,
    description: siteDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: `Ghost | ${AEO.oneLiner.replace(/\.$/, "")}`,
    description: siteDescription,
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-icon", type: "image/png", sizes: "180x180" }],
  },
  manifest: "/manifest.webmanifest",
  other: {
    "ai-content": "llms.txt",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className={`${serif.variable} ${sans.variable} ${instrument.variable} ${mono.variable} min-h-screen`}
      >
        <JsonLd data={siteGraphJsonLd(siteDescription)} />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
