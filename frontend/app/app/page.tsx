"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Droplets, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { WalletChip } from "@/components/wallet-chip";
import { unspentNotes } from "@/lib/notes";
import { shortAddr } from "@/lib/ghost";
import { explorerTx } from "@/lib/addresses";
import type { PoolActivityRow, PoolLiveStats } from "@/lib/pool-stats";

export default function OverviewPage() {
  const [notes, setNotes] = useState<number | null>(null);
  const [stats, setStats] = useState<PoolLiveStats | null>(null);
  const [rows, setRows] = useState<PoolActivityRow[] | null>(null);

  useEffect(() => {
    setNotes(unspentNotes().length);
    fetch("/api/pool-stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => setStats(null));
    fetch("/api/pool-activity")
      .then((r) => r.json())
      .then((b) => setRows(b.rows ?? []))
      .catch(() => setRows([]));
  }, []);

  const empty = notes === 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] tracking-[0.18em] text-gold uppercase">Overview</p>
          <h1 className="mt-1 font-serif text-4xl tracking-tight">The quiet ledger.</h1>
        </div>
        <Badge variant="outline">Devnet · test funds only</Badge>
      </div>

      <WalletChip />

      {empty && (
        <Card className="border-gold/35 shadow-none">
          <CardHeader>
            <CardTitle className="font-serif text-2xl">No notes yet — make your first deposit</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center justify-between gap-4">
            <p className="max-w-[52ch] text-sm text-muted-foreground">
              Shield exactly 1 USDC. You will receive a Ghost Note stored only in this browser.
            </p>
            <Button asChild size="pill">
              <Link href="/app/deposit">Deposit 1 USDC</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Shielded balance"
          value={notes == null ? null : `${notes} USDC`}
          hint="Unspent notes in this browser"
        />
        <StatCard
          label="Pool deposits"
          value={stats ? (stats.deposits != null ? String(stats.deposits) : "—") : null}
          hint="On-chain depositCount"
        />
        <StatCard
          label="Pool TVL"
          value={stats ? (stats.tvlUi != null ? `${stats.tvlUi} USDC` : "—") : null}
          hint="Vault ATA balance"
        />
        <StatCard
          label="Anonymity set"
          value={
            stats
              ? stats.anonymitySet != null
                ? `${stats.anonymitySet} leaves`
                : "—"
              : null
          }
          hint="Leaves currently in the tree"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="shadow-none">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-xs tracking-[0.16em] text-muted-foreground uppercase">
              Recent pool activity
            </CardTitle>
            <Link href="/app/activity" className="text-sm underline-offset-4 hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {rows == null && <Skeleton className="h-24" />}
            {rows && rows.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No pool events from the relayer yet. Deposits still land on-chain.
              </p>
            )}
            <ul className="space-y-3">
              {rows?.slice(0, 8).map((row) => (
                <li key={row.signature} className="flex items-center justify-between gap-3 text-sm">
                  <span className="capitalize">{row.kind}</span>
                  <span className="text-muted-foreground">{row.detail}</span>
                  <a
                    className="font-mono text-xs underline-offset-2 hover:underline"
                    href={explorerTx(row.signature)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {shortAddr(row.signature, 6)}
                  </a>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xs tracking-[0.16em] text-muted-foreground uppercase">
              <Droplets className="size-3.5" /> Get test USDC
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              This mint is <strong className="text-foreground">mock USDC on Devnet</strong>, not
              Circle&apos;s token. The demo operator minted it for testers.
            </p>
            <p>
              You also need Devnet SOL for deposits. The public faucet is{" "}
              <a
                className="underline"
                href="https://faucet.solana.com"
                target="_blank"
                rel="noreferrer"
              >
                faucet.solana.com
              </a>{" "}
              (often GitHub-gated).
            </p>
            <p className="flex gap-2 text-xs">
              <Info className="mt-0.5 size-3.5 shrink-0" />
              Relayer status:{" "}
              {stats == null
                ? "…"
                : stats.relayerOk
                  ? `healthy (${stats.cluster})`
                  : "unreachable"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button asChild size="pill">
          <Link href="/app/deposit">Deposit 1 USDC</Link>
        </Button>
        <Button asChild size="pill" variant="outline" className="rounded-full">
          <Link href="/app/withdraw">Withdraw</Link>
        </Button>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | null;
  hint: string;
}) {
  return (
    <Card className="shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {value == null ? (
          <Skeleton className="h-9 w-24" />
        ) : (
          <p className="font-serif text-3xl tracking-tight">{value}</p>
        )}
        <p className="mt-2 text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}
