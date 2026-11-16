"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/page-header";
import { useGhostWallet } from "@/hooks/useGhostWallet";
import {
  fetchGasNoteBalance,
  listGasNotes,
  topUpGasCredits,
  type StoredGasNote,
} from "@/lib/gas-credits";
import { fetchGasConfig, type GasConfig } from "@/lib/gas";

export default function CreditsPage() {
  const { publicKey, signTransaction, connected } = useGhostWallet();
  const [amount, setAmount] = useState("1");
  const [busy, setBusy] = useState(false);
  const [gas, setGas] = useState<GasConfig | null>(null);
  const [notes, setNotes] = useState<StoredGasNote[]>([]);
  const [lastNote, setLastNote] = useState("");

  function refresh() {
    setNotes(listGasNotes());
  }

  useEffect(() => {
    refresh();
    fetchGasConfig()
      .then(setGas)
      .catch(() => setGas(null));
  }, []);

  async function onTopUp() {
    if (!connected || !publicKey || !signTransaction) {
      toast.error("Connect X1 (funded wallet) to top up gas credits.");
      return;
    }
    setBusy(true);
    try {
      toast.message("Depositing USDC into Ghost gas pool…");
      const stored = await topUpGasCredits({
        uiAmount: amount,
        publicKey,
        signTransaction,
      });
      setLastNote(stored.note);
      refresh();
      toast.success("Gas credits funded. Save the gas note — X2 needs it to send.");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function refreshBalance(note: string) {
    try {
      const bal = await fetchGasNoteBalance(note);
      setNotes((prev) =>
        prev.map((n) => (n.note === note ? { ...n, remaining: bal.remaining } : n)),
      );
      toast.message(`Remaining: ${bal.remaining} base units`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  }

  const feeUi =
    gas?.creditFeeRaw != null
      ? (Number(gas.creditFeeRaw) / 1_000_000).toFixed(4)
      : "—";

  return (
    <div className="mx-auto max-w-xl space-y-10">
      <PageHeader
        tag="Gas credits"
        title="X1 pays. X2 spends."
        description="Deposit USDC from your main wallet (X1). You get a gas note. When X2 sends tokens, Ghost sponsors SOL and debits this note — no SOL bridge from X1 to X2."
      />

      <p className="t-14 font-normal text-ink/55">
        Fee per sponsored send: ~{feeUi} USDC (from the note). Treasury:{" "}
        <span className="font-mono text-xs">
          {gas?.treasury ? `${gas.treasury.slice(0, 4)}…${gas.treasury.slice(-4)}` : "—"}
        </span>
      </p>

      <section className="border border-ink/15 bg-paper p-6 md:p-8">
        <Label htmlFor="credit-amount">Top up (USDC)</Label>
        <Input
          id="credit-amount"
          className="mt-2 rounded-none border-ink/15 bg-cream"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          inputMode="decimal"
        />
        <Button
          size="pill"
          className="mt-6 w-full"
          disabled={busy || !connected}
          onClick={onTopUp}
          data-testid="gas-credit-topup"
        >
          {busy ? "Depositing…" : "Deposit USDC → get gas note"}
        </Button>
      </section>

      {lastNote && (
        <section className="border border-ink/15 border-l-4 border-l-sun bg-sun/30 p-6">
          <span className="tag">Save your gas note</span>
          <p className="mt-4 break-all font-mono text-xs leading-relaxed">{lastNote}</p>
          <Button
            size="sm"
            variant="outline"
            className="mt-4"
            onClick={() => {
              void navigator.clipboard.writeText(lastNote);
              toast.success("Gas note copied.");
            }}
          >
            Copy note
          </Button>
        </section>
      )}

      <section className="space-y-3">
        <span className="tag text-ink/60">Notes in this browser</span>
        {notes.length === 0 && (
          <p className="t-14 font-normal text-ink/50">No gas notes yet.</p>
        )}
        <ul className="space-y-3">
          {notes.map((n) => (
            <li
              key={n.commitment}
              className="border border-ink/15 bg-paper px-4 py-3 font-mono text-xs"
            >
              <p className="truncate">{n.note}</p>
              <p className="mt-2 text-ink/55">
                remaining {n.remaining ?? "?"} / initial {n.initialAmount}
              </p>
              <button
                type="button"
                className="mt-2 underline"
                onClick={() => refreshBalance(n.note)}
              >
                Refresh balance
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
