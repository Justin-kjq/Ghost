"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CLUSTER } from "@/lib/config";
import { fetchPoolInfo, fetchRelayerHealth, shortAddr } from "@/lib/ghost";
import { unspentNotes } from "@/lib/notes";

type PoolInfo = {
  depositCount?: number;
  vault?: string;
  nextIndex?: number;
};

type Health = {
  ok?: boolean;
  cluster?: string;
  deposits?: number;
};

export default function OverviewPage() {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const [notes, setNotes] = useState(0);
  const [pool, setPool] = useState<PoolInfo | null>(null);
  const [health, setHealth] = useState<Health | null>(null);
  const [tvl, setTvl] = useState<string>("—");

  useEffect(() => {
    setNotes(unspentNotes().length);
    fetchPoolInfo()
      .then(async (info: PoolInfo) => {
        setPool(info);
        if (info.vault) {
          try {
            const bal = await connection.getTokenAccountBalance(new PublicKey(info.vault));
            const ui = bal.value.uiAmountString ?? bal.value.uiAmount?.toString();
            const n = Number(ui);
            if (ui && Number.isFinite(n) && n > 0) setTvl(`${ui} USDC`);
            else if (info.depositCount != null) setTvl(`${info.depositCount} × 1 USDC posted`);
          } catch {
            if (info.depositCount != null) setTvl(`${info.depositCount} × 1 USDC posted`);
          }
        }
      })
      .catch(() => setPool(null));
    fetchRelayerHealth()
      .then(setHealth)
      .catch(() => setHealth(null));
  }, [connection]);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs tracking-[0.18em] text-gold uppercase">Overview</p>
        <h1 className="mt-1 font-serif text-4xl tracking-tight">The quiet ledger.</h1>
        <p className="mt-2 font-mono text-xs text-muted-foreground">
          {publicKey ? shortAddr(publicKey.toBase58(), 6) : "—"}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Shielded balance"
          value={`${notes} USDC`}
          hint="Unspent notes stored in this browser"
        />
        <StatCard
          label="Pool deposits"
          value={pool?.depositCount != null ? String(pool.depositCount) : "—"}
          hint="On-chain depositCount"
        />
        <StatCard label="Pool TVL" value={tvl} hint="Vault token balance, else deposit count" />
        <div className="rounded-xl border border-hairline bg-card p-5">
          <p className="text-xs tracking-[0.16em] text-muted-foreground uppercase">Relayer</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge variant={health?.ok ? "default" : "outline"}>
              {health?.ok ? "Healthy" : "Down"}
            </Badge>
            <Badge variant="outline" className="capitalize">
              {health?.cluster || CLUSTER}
            </Badge>
          </div>
          <p className="mt-3 font-mono text-xs text-muted-foreground">
            {health?.deposits != null ? `${health.deposits} cached leaves` : "status from /health"}
          </p>
        </div>
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
  value: string;
  hint: string;
}) {
  return (
    <Card className="shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="font-serif text-3xl">{value}</p>
        <p className="mt-2 text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}
