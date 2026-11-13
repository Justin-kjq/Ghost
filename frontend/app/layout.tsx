import type { Metadata } from "next";
import { Fraunces, IBM_Plex_Sans } from "next/font/google";
import { SolanaProviders } from "./components/WalletProvider";
import "./globals.css";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display-loaded",
});

const body = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body-loaded",
});

export const metadata: Metadata = {
  title: "Ghost — Solana Privacy Pool",
  description: "Compliant-leaning private USDC transfers on Solana Devnet",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${body.variable}`}>
        <SolanaProviders>{children}</SolanaProviders>
      </body>
    </html>
  );
}
