"use client";

import { useState } from "react";
import { redirect } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useGhostWallet } from "@/hooks/useGhostWallet";
import { CLUSTER, SHIELD_ENABLED } from "@/lib/config";
import { recordActivity, explorerTx } from "@/lib/activity";
import { depositUsdc } from "@/lib/ghost";
import { saveNote } from "@/lib/notes";
import { PageHeader } from "@/components/page-header";

export default function DepositPage() {
  if (!SHIELD_ENABLED) redirect("/app/send");
  const { publicKey, signTransaction, anchorWallet } = useGhostWallet();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [tx, setTx] = useState("");

  async function onDeposit() {
    if (!publicKey || !signTransaction || !anchorWallet) {
      toast.error("Connect a wallet first.");
      return;
    }
    setBusy(true);
    setNote("");
    setTx("");
    try {
      toast.message("Creating commitment and depositing 1 USDC…");
      const result = await depositUsdc(anchorWallet as any);
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
    <div className="mx-auto max-w-xl space-y-10">
      <PageHeader
        tag="Deposit"
        title="One USDC. One leaf."
        description="Deposit 1 USDC and receive a Ghost Note. Treat it as a private key."
      />

      <section className="border border-ink/15 bg-paper p-6 md:p-8">
        <div className="flex items-baseline justify-between border border-ink/15 bg-cream px-4 py-4">
          <span className="t-14 text-ink/55">Amount</span>
          <span className="t-28">1.00 USDC</span>
        </div>
        <Button
          size="pill"
          className="mt-6 w-full"
          disabled={busy}
          onClick={onDeposit}
          data-testid="deposit-submit"
        >
          {busy ? "Depositing…" : "Deposit 1 USDC"}
        </Button>
      </section>

      {note && (
        <section
          className="border border-ink/15 border-l-4 border-l-sun bg-sun/30 p-6 md:p-8"
          data-testid="deposit-note"
        >
          <span className="tag">Save your Ghost Note</span>
          <p className="t-14 mt-3 font-normal text-ink/65">
            Anyone with this string can withdraw. It is also stored under Notes.
          </p>
          <p className="mt-5 break-all font-mono text-xs leading-relaxed">{note}</p>
          <div className="mt-4 flex flex-wrap gap-3">
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
          </div>
          {tx && (
            <p className="mt-4 font-mono text-xs">
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
        </section>
      )}
    </div>
  );
}
