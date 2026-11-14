"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CLUSTER } from "@/lib/config";
import { recordActivity, explorerTx } from "@/lib/activity";
import { depositUsdc } from "@/lib/ghost";
import { saveNote } from "@/lib/notes";
import { PoolSidePanel } from "@/components/pool-side-panel";

export default function DepositPage() {
  const wallet = useWallet();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [tx, setTx] = useState("");

  async function onDeposit() {
    if (!wallet.publicKey || !wallet.signTransaction) {
      toast.error("Connect a wallet first.");
      return;
    }
    setBusy(true);
    setNote("");
    setTx("");
    try {
      toast.message("Creating commitment and depositing 1 USDC…");
      const result = await depositUsdc(wallet as any);
      saveNote({
        note: result.note,
        leafIndex: result.leafIndex,
        commitment: result.commitment,
        depositTx: result.signature,
        createdAt: new Date().toISOString(),
      });
      recordActivity({
        kind: "deposit",
        signature: result.signature,
        explorer: explorerTx(result.signature, CLUSTER),
        at: new Date().toISOString(),
        detail: `leaf ${result.leafIndex}`,
      });
      setNote(result.note);
      setTx(result.signature);
      toast.success("Deposit confirmed. Save your Ghost Note.");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[11px] tracking-[0.18em] text-gold uppercase">Deposit</p>
        <h1 className="mt-1 font-serif text-4xl tracking-tight">One USDC. One leaf.</h1>
        <p className="prose-muted mt-3">
          The pool denomination is fixed at 1 USDC. You will receive a Ghost Note —
          treat it as a private key.
        </p>
      </div>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.85fr)]">
        <div className="space-y-6">
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle className="font-serif">Amount</CardTitle>
              <CardDescription>Fixed by the on-chain pool config.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-baseline justify-between rounded-lg border border-hairline px-4 py-3">
                <span className="text-sm text-muted-foreground">Deposit</span>
                <span className="font-serif text-2xl">1.00 USDC</span>
              </div>
              <Button
                size="pill"
                className="w-full"
                disabled={busy}
                onClick={onDeposit}
                data-testid="deposit-submit"
              >
                {busy ? "Depositing…" : "Deposit 1 USDC"}
              </Button>
            </CardContent>
          </Card>

          {note && (
            <Card className="border-gold/40 shadow-none" data-testid="deposit-note">
              <CardHeader>
                <CardTitle className="font-serif">Save your Ghost Note</CardTitle>
                <CardDescription>
                  Anyone with this string can withdraw. It is also stored in this
                  browser under Notes.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="font-mono text-xs leading-relaxed break-all">{note}</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    void navigator.clipboard.writeText(note);
                    toast.success("Note copied.");
                  }}
                >
                  Copy note
                </Button>
                {tx && (
                  <p className="font-mono text-xs">
                    Tx:{" "}
                    <a
                      className="underline"
                      href={explorerTx(tx, CLUSTER)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {tx}
                    </a>
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <PoolSidePanel>
          <div>
            <p className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
              Before you deposit
            </p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>You need Devnet SOL for the deposit transaction.</li>
              <li>The mint is mock USDC, not Circle&apos;s token.</li>
              <li>Export the Ghost Note before clearing this browser.</li>
            </ul>
          </div>
        </PoolSidePanel>
      </div>
    </div>
  );
}
