"use client";

import { useEffect, useMemo, type ReactNode } from "react";
import {
  ConnectionProvider,
  WalletProvider,
  useWallet,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { ENABLE_DEV_WALLET, RPC_URL } from "@/lib/config";
import { GhostDevWalletAdapter, GhostDevWalletName } from "@/lib/devWallet";

import "@solana/wallet-adapter-react-ui/styles.css";

function AutoConnectDevWallet() {
  const { wallets, select, connect, connected, connecting, wallet, publicKey } =
    useWallet();

  useEffect(() => {
    if (!ENABLE_DEV_WALLET || connected || connecting) return;
    if (typeof window === "undefined" || !window.__GHOST_DEV_WALLET__) return;
    if (!window.location.pathname.startsWith("/app")) return;
    const ghost = wallets.find((w) => w.adapter.name === GhostDevWalletName);
    if (!ghost) return;
    if (wallet?.adapter.name !== GhostDevWalletName) {
      select(GhostDevWalletName);
      return;
    }
    // Defer so WalletProvider can attach 'connect' listeners first.
    const t = window.setTimeout(() => {
      connect().catch((err) => console.warn("[ghost] auto-connect failed", err));
    }, 150);
    return () => window.clearTimeout(t);
  }, [wallets, select, connect, connected, connecting, wallet]);

  if (!connected || !publicKey) return null;
  return (
    <div data-testid="ghost-dev-wallet-connected" style={{ display: "none" }}>
      {publicKey.toBase58()}
    </div>
  );
}

export function SolanaProviders({ children }: { children: ReactNode }) {
  const wallets = useMemo(() => {
    const list = [];
    if (ENABLE_DEV_WALLET) list.push(new GhostDevWalletAdapter());
    list.push(new PhantomWalletAdapter());
    return list;
  }, []);
  return (
    <ConnectionProvider endpoint={RPC_URL}>
      <WalletProvider wallets={wallets} autoConnect={false}>
        <WalletModalProvider>
          {ENABLE_DEV_WALLET ? <AutoConnectDevWallet /> : null}
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
