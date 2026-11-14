"use client";

import { useMemo, type ReactNode } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { ENABLE_DEV_WALLET, RPC_URL } from "@/lib/config";
import { GhostDevWalletAdapter } from "@/lib/devWallet";

import "@solana/wallet-adapter-react-ui/styles.css";

export function SolanaProviders({ children }: { children: ReactNode }) {
  const wallets = useMemo(() => {
    const list = [];
    if (ENABLE_DEV_WALLET) list.push(new GhostDevWalletAdapter());
    list.push(new PhantomWalletAdapter());
    return list;
  }, []);
  return (
    <ConnectionProvider endpoint={RPC_URL}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
