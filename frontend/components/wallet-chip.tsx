"use client";

import { useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { getAssociatedTokenAddressSync, getAccount } from "@solana/spl-token";
import { Button } from "@/components/ui/button";
import { shortAddr } from "@/lib/ghost";
import { USDC_MINT_STR } from "@/lib/config";
import { PublicKey } from "@solana/web3.js";

export function WalletChip({ compact = false }: { compact?: boolean }) {
  const { publicKey, disconnect } = useWallet();
  const { connection } = useConnection();
  const [sol, setSol] = useState<string | null>(null);
  const [usdc, setUsdc] = useState<string | null>(null);

  useEffect(() => {
    if (!publicKey) return;
    let cancelled = false;
    (async () => {
      try {
        const lamports = await connection.getBalance(publicKey);
        if (!cancelled) setSol((lamports / LAMPORTS_PER_SOL).toFixed(3));
      } catch {
        if (!cancelled) setSol(null);
      }
      if (!USDC_MINT_STR) return;
      try {
        const ata = getAssociatedTokenAddressSync(new PublicKey(USDC_MINT_STR), publicKey);
        const acc = await getAccount(connection, ata);
        if (!cancelled) setUsdc((Number(acc.amount) / 1_000_000).toFixed(3));
      } catch {
        if (!cancelled) setUsdc("0");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [publicKey, connection]);

  if (!publicKey) return null;
  const addr = publicKey.toBase58();

  if (compact) {
    return (
      <div className="rounded-xl border border-sidebar-border px-3 py-3">
        <p className="font-mono text-[11px] text-sidebar-foreground">{shortAddr(addr, 4)}</p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          {sol != null ? `${sol} SOL` : "—"}
          {usdc != null ? ` · ${usdc} USDC` : ""}
        </p>
        <Button
          size="sm"
          variant="ghost"
          className="mt-2 h-7 px-2 text-xs"
          onClick={() => disconnect()}
        >
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-hairline bg-card px-5 py-4">
      <div>
        <p className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">Connected</p>
        <p className="mt-1 font-mono text-sm">{shortAddr(addr, 6)}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {sol != null ? `${sol} SOL` : "—"} · {usdc != null ? `${usdc} mock USDC` : "—"}
        </p>
      </div>
      <Button size="pill" variant="outline" className="rounded-full" onClick={() => disconnect()}>
        Disconnect
      </Button>
    </div>
  );
}
