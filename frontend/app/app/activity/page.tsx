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

export default function ActivityPage() {
  const [rows, setRows] = useState<ActivityItem[]>([]);
  useEffect(() => {
    setRows(listActivity());
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs tracking-[0.18em] text-gold uppercase">Activity</p>
        <h1 className="mt-1 font-serif text-4xl tracking-tight">This browser&apos;s trail.</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Local only. Explorer links open Solana Devnet.
        </p>
      </div>
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
                  No local activity yet.
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
    </div>
  );
}
