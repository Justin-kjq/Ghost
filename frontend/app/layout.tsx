import type { Metadata } from "next";
import {
  Instrument_Sans,
  Instrument_Serif,
  Inter,
  JetBrains_Mono,
} from "next/font/google";
import { Providers } from "@/components/providers";
import { SITE_URL } from "@/lib/addresses";
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

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Ghost — Private USDC on Solana",
    template: "%s · Ghost",
  },
  description:
    "Shielded USDC deposits and gasless private withdrawals on Solana. Proofs stay in the browser.",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "Ghost",
    title: "Ghost — Private USDC on Solana",
    description:
      "Shielded USDC deposits and gasless private withdrawals on Solana.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ghost — Private USDC on Solana",
    description:
      "Shielded USDC deposits and gasless private withdrawals on Solana.",
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
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
