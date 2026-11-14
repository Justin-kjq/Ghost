"use client";

import { Droplets } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WalletChip } from "@/components/wallet-chip";
import {
  CLUSTER,
  ENABLE_DEV_WALLET,
  PROGRAM_ID,
  RELAYER_URL,
  RPC_URL,
  USDC_MINT_STR,
} from "@/lib/config";
import { DEVNET, explorerAddress } from "@/lib/addresses";

export default function SettingsPage() {
  const mint = USDC_MINT_STR || DEVNET.mint;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <p className="text-[11px] tracking-[0.18em] text-gold uppercase">Settings</p>
        <h1 className="mt-1 font-serif text-4xl tracking-tight">Public configuration.</h1>
      </div>

      <WalletChip />

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xs tracking-[0.16em] text-muted-foreground uppercase">
            <Droplets className="size-3.5" /> Get test USDC
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            This mint is mock USDC on Devnet, not Circle&apos;s token. Ask the demo
            operator for a drop, or reuse leftover test funds.
          </p>
          <p>
            Devnet SOL:{" "}
            <a
              className="underline"
              href="https://faucet.solana.com"
              target="_blank"
              rel="noreferrer"
            >
              faucet.solana.com
            </a>
            . Often GitHub-gated.
          </p>
        </CardContent>
      </Card>

      <dl className="space-y-4 text-sm">
        <Row k="Cluster" v={CLUSTER} />
        <Row k="RPC" v={RPC_URL} />
        <Row
          k="Program"
          v={PROGRAM_ID.toBase58()}
          href={explorerAddress(PROGRAM_ID.toBase58())}
        />
        <Row k="Mint" v={mint} href={explorerAddress(mint)} />
        <Row k="Relayer" v={RELAYER_URL} />
        <Row k="Dev wallet" v={ENABLE_DEV_WALLET ? "enabled" : "off"} />
      </dl>
      <p className="text-xs text-muted-foreground">
        Paper is the default canvas. A full dark theme for the pool is intentionally
        omitted. Devnet only. Unaudited.
      </p>
    </div>
  );
}

function Row({ k, v, href }: { k: string; v: string; href?: string }) {
  return (
    <div className="border-t border-hairline pt-3">
      <dt className="text-xs tracking-[0.16em] text-muted-foreground uppercase">{k}</dt>
      <dd className="mt-1 font-mono text-xs break-all">
        {href ? (
          <a className="underline-offset-2 hover:underline" href={href} target="_blank" rel="noreferrer">
            {v}
          </a>
        ) : (
          v
        )}
      </dd>
    </div>
  );
}
