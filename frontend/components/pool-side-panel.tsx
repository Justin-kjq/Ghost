"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { PoolActivityRow, PoolLiveStats } from "@/lib/pool-stats";
import { shortAddr } from "@/lib/ghost";
import { explorerTx } from "@/lib/addresses";
import { Skeleton } from "@/components/ui/skeleton";

export function PoolSidePanel({
  children,
}: {
  children?: React.ReactNode;
}) {
  const [stats, setStats] = useState<PoolLiveStats | null>(null);
  const [rows, setRows] = useState<PoolActivityRow[] | null>(null);

  useEffect(() => {
    fetch("/api/pool-stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => setStats(null));
    fetch("/api/pool-activity")
      .then((r) => r.json())
      .then((b) => setRows(b.rows ?? []))
      .catch(() => setRows([]));
  }, []);

  return (
    <aside className="space-y-6 rounded-2xl border border-hairline bg-card/70 p-5">
      {children}
      <div>
        <p className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
          Anonymity set
        </p>
        {stats ? (
          <p className="mt-1 font-serif text-3xl">
            {stats.anonymitySet != null ? stats.anonymitySet : "—"}
            <span className="ml-2 text-base text-muted-foreground">leaves</span>
          </p>
        ) : (
          <Skeleton className="mt-2 h-8 w-24" />
        )}
        <p className="mt-2 text-sm text-muted-foreground">
          Larger sets make deposits harder to link. This is the on-chain leaf count.
        </p>
      </div>
      <div>
        <p className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
          Recent pool activity
        </p>
        <ul className="mt-3 space-y-2">
          {rows == null && <Skeleton className="h-16" />}
          {rows && rows.length === 0 && (
            <li className="text-sm text-muted-foreground">No pool events yet.</li>
          )}
          {rows?.slice(0, 6).map((row) => (
            <li key={row.signature} className="flex items-baseline justify-between gap-3 text-sm">
              <span className="capitalize text-muted-foreground">{row.kind}</span>
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
        <Link href="/app/activity" className="mt-3 inline-block text-sm underline-offset-4 hover:underline">
          All activity
        </Link>
      </div>
    </aside>
  );
}
