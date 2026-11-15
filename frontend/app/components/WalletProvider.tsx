"use client";

import { useEffect, type ReactNode } from "react";
import { ConnectionProvider } from "@solana/wallet-adapter-react";
import { ENABLE_DEV_WALLET, RPC_URL } from "@/lib/config";
import "@/lib/appkit";
import { useGhostWallet } from "@/hooks/useGhostWallet";

function AutoConnectDevWallet() {
  const { connected, connecting, connectDevWallet, publicKey } =
    useGhostWallet();

  useEffect(() => {
    if (!ENABLE_DEV_WALLET || connected || connecting) return;
    if (typeof window === "undefined" || !window.__GHOST_DEV_WALLET__) return;
    if (!window.location.pathname.startsWith("/app")) return;
    const t = window.setTimeout(() => {
      connectDevWallet().catch((err) =>
        console.warn("[ghost] auto-connect failed", err),
      );
    }, 150);
    return () => window.clearTimeout(t);
  }, [connected, connecting, connectDevWallet]);

  if (!connected || !publicKey) return null;
  return (
    <div data-testid="ghost-dev-wallet-connected" style={{ display: "none" }}>
      {publicKey.toBase58()}
    </div>
  );
}

export function SolanaProviders({ children }: { children: ReactNode }) {
  return (
    <ConnectionProvider endpoint={RPC_URL}>
      {ENABLE_DEV_WALLET ? <AutoConnectDevWallet /> : null}
      {children}
    </ConnectionProvider>
  );
}
