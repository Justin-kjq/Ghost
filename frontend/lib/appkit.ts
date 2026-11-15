"use client";

import { createAppKit } from "@reown/appkit/react";
import { SolanaAdapter } from "@reown/appkit-adapter-solana/react";
import { solana, solanaDevnet, solanaTestnet } from "@reown/appkit/networks";
import { SITE_URL } from "@/lib/addresses";
import { CLUSTER } from "@/lib/config";

/**
 * Reown AppKit (WalletConnect) project id — https://dashboard.reown.com
 * The public fallback only works on localhost.
 */
export const WALLETCONNECT_PROJECT_ID =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ||
  process.env.NEXT_PUBLIC_PROJECT_ID ||
  "b56e18d47c72ab683b10814fe9495694";

const metadata = {
  name: "Ghost",
  description: "Private, gasless USDC transfers on Solana",
  // Must match the page origin (localhost in dev, SITE_URL in prod).
  url:
    typeof window !== "undefined" ? window.location.origin : SITE_URL,
  icons: ["https://avatars.githubusercontent.com/u/179229932"],
};

const solanaAdapter = new SolanaAdapter();

const defaultNetwork =
  CLUSTER === "mainnet-beta" || CLUSTER === "mainnet"
    ? solana
    : CLUSTER === "testnet"
      ? solanaTestnet
      : solanaDevnet;

// Cross-package AppKitNetwork vs viem Chain typing needs a wide cast.
const networks = [solanaDevnet, solanaTestnet, solana] as unknown as [
  typeof solanaDevnet,
  typeof solanaTestnet,
  typeof solana,
];

/**
 * Initialize at module scope (client bundle) so AppKit hooks work.
 * createAppKit is idempotent enough for HMR via the singleton guard.
 */
let initialized = false;

export function ensureAppKit() {
  if (initialized) return;
  initialized = true;

  createAppKit({
    adapters: [solanaAdapter],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    networks: networks as any,
    defaultNetwork: defaultNetwork as any,
    metadata,
    projectId: WALLETCONNECT_PROJECT_ID,
    allWallets: "SHOW",
    features: {
      analytics: false,
      email: false,
      socials: false,
      onramp: false,
      swaps: false,
    },
    themeMode: "light",
    themeVariables: {
      "--w3m-accent": "#252324",
      "--w3m-border-radius-master": "0px",
    },
  });
}

// Side-effect init when this module is first imported from a client component.
ensureAppKit();
