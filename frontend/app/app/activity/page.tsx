"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listActivity, type ActivityItem } from "@/lib/activity";
import { shortAddr } from "@/lib/ghost";
import { explorerTx } from "@/lib/addresses";
import type { PoolActivityRow } from "@/lib/pool-stats";
import { Skeleton } from "@/components/ui/skeleton";

export default function ActivityPage() {
  const [rows, setRows] = useState<ActivityItem[]>([]);
  const [pool, setPool] = useState<PoolActivityRow[] | null>(null);

  useEffect(() => {
    setRows(listActivity());
    fetch("/api/pool-activity")
      .then((r) => r.json())
      .then((b) => setPool(b.rows ?? []))
      .catch(() => setPool([]));
  }, []);

  return (
    <div className="space-y-10">
      <div>
        <p className="text-[11px] tracking-[0.18em] text-gold uppercase">Activity</p>
        <h1 className="mt-1 font-serif text-4xl tracking-tight">This browser&apos;s trail.</h1>
        <p className="prose-muted mt-3">
          Local events live only in this browser. Pool events come from the relayer and
          on-chain signatures.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-xs tracking-[0.16em] text-muted-foreground uppercase">Local</h2>
        <div className="overflow-x-auto rounded-xl border border-hairline">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kind</TableHead>
                <TableHead>When</TableHead>
                <TableHead>Signature</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-muted-foreground">
                    No local activity yet. Deposit or withdraw to see it here.
                  </TableCell>
                </TableRow>
              )}
              {rows.map((row) => (
                <TableRow key={row.signature}>
                  <TableCell className="capitalize">{row.kind}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(row.at).toLocaleString()}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    <a
                      className="underline"
                      href={row.explorer}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {shortAddr(row.signature, 8)}
                    </a>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xs tracking-[0.16em] text-muted-foreground uppercase">
          Pool
        </h2>
        <div className="overflow-x-auto rounded-xl border border-hairline">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kind</TableHead>
                <TableHead>Detail</TableHead>
                <TableHead>Signature</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pool == null && (
                <TableRow>
                  <TableCell colSpan={3}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              )}
              {pool && pool.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-muted-foreground">
                    No pool events yet.
                  </TableCell>
                </TableRow>
              )}
              {pool?.map((row) => (
                <TableRow key={row.signature}>
                  <TableCell className="capitalize">{row.kind}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {row.detail || "—"}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    <a
                      className="underline"
                      href={explorerTx(row.signature)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {shortAddr(row.signature, 8)}
                    </a>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
}
