"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { Button } from "@/components/ui/button";
import {
  CLUSTER,
  ENABLE_DEV_WALLET,
  PROGRAM_ID,
  RELAYER_URL,
  RPC_URL,
  USDC_MINT_STR,
} from "@/lib/config";

export default function SettingsPage() {
  const { publicKey, disconnect } = useWallet();
  const mint = USDC_MINT_STR || "(unset)";

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <p className="text-xs tracking-[0.18em] text-gold uppercase">Settings</p>
        <h1 className="mt-1 font-serif text-4xl tracking-tight">Public configuration.</h1>
      </div>
      <dl className="space-y-4 text-sm">
        <Row k="Cluster" v={CLUSTER} />
        <Row k="RPC" v={RPC_URL} />
        <Row k="Program" v={PROGRAM_ID.toBase58()} />
        <Row k="Mint" v={mint} />
        <Row k="Relayer" v={RELAYER_URL} />
        <Row k="Dev wallet" v={ENABLE_DEV_WALLET ? "enabled" : "off"} />
        <Row k="Connected" v={publicKey?.toBase58() || "—"} />
      </dl>
      <Button
        size="pill"
        variant="outline"
        className="rounded-full"
        onClick={() => disconnect()}
      >
        Disconnect
      </Button>
      <p className="text-xs text-muted-foreground">
        Paper is the default canvas. A full dark theme for the pool is intentionally
        omitted.
      </p>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="border-t border-hairline pt-3">
      <dt className="text-xs tracking-[0.16em] text-muted-foreground uppercase">{k}</dt>
      <dd className="mt-1 font-mono text-xs break-all">{v}</dd>
    </div>
  );
}
