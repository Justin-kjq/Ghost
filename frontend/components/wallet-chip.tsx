"use client";

import { useEffect, useState } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddressSync, getAccount } from "@solana/spl-token";
import { useGhostWallet } from "@/hooks/useGhostWallet";
import { Button } from "@/components/ui/button";
import { shortAddr } from "@/lib/ghost";
import { USDC_MINT_STR } from "@/lib/config";

export function WalletChip({ compact = false }: { compact?: boolean }) {
  const { publicKey, disconnect } = useGhostWallet();
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
        const ata = getAssociatedTokenAddressSync(
          new PublicKey(USDC_MINT_STR),
          publicKey,
        );
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
      <div className="border border-cream/15 px-3 py-3 text-cream">
        <p className="font-mono text-[11px]">{shortAddr(addr, 4)}</p>
        <p className="mt-1 text-[11px] text-cream/50">
          {sol != null ? `${sol} SOL` : "-"}
          {usdc != null ? ` · ${usdc} USDC` : ""}
        </p>
        <button
          type="button"
          className="mt-3 text-[12px] text-cream/70 underline-offset-2 hover:text-cream hover:underline"
          onClick={() => disconnect()}
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border border-ink/15 bg-paper px-5 py-4">
      <div>
        <span className="tag text-ink/60">Connected</span>
        <p className="mt-3 font-mono text-sm">{shortAddr(addr, 6)}</p>
        <p className="mt-1 text-sm text-ink/60">
          {sol != null ? `${sol} SOL` : "-"} ·{" "}
          {usdc != null ? `${usdc} USDC` : "-"}
        </p>
      </div>
      <Button size="sm" variant="outline" onClick={() => disconnect()}>
        Disconnect
      </Button>
    </div>
  );
}
