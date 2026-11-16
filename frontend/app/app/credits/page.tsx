"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Copy, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AppWorkspace,
  RailBlock,
  StatusPill,
  WorkspacePanel,
  formatUsdcRaw,
} from "@/components/app-workspace";
import { useGhostWallet } from "@/hooks/useGhostWallet";
import {
  fetchGasNoteBalance,
  listGasNotes,
  topUpGasCredits,
  type StoredGasNote,
} from "@/lib/gas-credits";
import { fetchGasConfig, type GasConfig } from "@/lib/gas";
import { shortAddr } from "@/lib/ghost";

const PRESETS = ["1", "5", "10", "25"];

export default function CreditsPage() {
  const { publicKey, signTransaction, connected } = useGhostWallet();
  const [amount, setAmount] = useState("5");
  const [busy, setBusy] = useState(false);
  const [gas, setGas] = useState<GasConfig | null>(null);
  const [notes, setNotes] = useState<StoredGasNote[]>([]);
  const [lastNote, setLastNote] = useState("");
  const [refreshing, setRefreshing] = useState<string | null>(null);

  function refresh() {
    setNotes(listGasNotes());
  }

  useEffect(() => {
    refresh();
    fetchGasConfig()
      .then(setGas)
      .catch(() => setGas(null));
  }, []);

  const totalRemaining = useMemo(() => {
    let sum = 0n;
    let known = false;
    for (const n of notes) {
      if (n.remaining != null && /^\d+$/.test(n.remaining)) {
        sum += BigInt(n.remaining);
        known = true;
      }
    }
    return known ? sum.toString() : null;
  }, [notes]);

  const feeUi =
    gas?.creditFeeRaw != null
      ? (Number(gas.creditFeeRaw) / 1_000_000).toFixed(2)
      : "—";

  const estimatedSends =
    totalRemaining != null && gas?.creditFeeRaw
      ? Math.floor(Number(totalRemaining) / Number(gas.creditFeeRaw))
      : null;

  async function onTopUp() {
    if (!connected || !publicKey || !signTransaction) {
      toast.error("Connect a funded wallet to top up gas credits.");
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
      toast.success("Credit funded. Save the note — Send needs it.");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function refreshBalance(note: string) {
    setRefreshing(note);
    try {
      const bal = await fetchGasNoteBalance(note);
      setNotes((prev) =>
        prev.map((n) => (n.note === note ? { ...n, remaining: bal.remaining } : n)),
      );
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setRefreshing(null);
    }
  }

  async function copyNote(note: string) {
    await navigator.clipboard.writeText(note);
    toast.success("Gas note copied");
  }

  return (
    <AppWorkspace
      title="Credits"
      description="Prepay USDC once. Any wallet with the note can send tokens while Ghost covers network fees."
      actions={
        <>
          <StatusPill tone={notes.length ? "ok" : "warn"}>
            {notes.length
              ? `${notes.length} note${notes.length === 1 ? "" : "s"} saved`
              : "No notes yet"}
          </StatusPill>
          <StatusPill tone="neutral">{feeUi} USDC / send</StatusPill>
        </>
      }
      rail={
        <>
          <RailBlock title="Balance in this browser">
            <p className="text-[28px] tracking-[-0.03em] text-ink">
              {formatUsdcRaw(totalRemaining)}{" "}
              <span className="text-[13px] text-ink/50">USDC</span>
            </p>
            {estimatedSends != null ? (
              <p className="mt-2">~{estimatedSends} sponsored sends left</p>
            ) : (
              <p className="mt-2">Refresh a note to see remaining credit.</p>
            )}
          </RailBlock>

          <RailBlock title="Who pays what">
            <ul className="space-y-2">
              <li>
                <span className="text-ink">You</span> — USDC top-up + token transfer
                signature
              </li>
              <li>
                <span className="text-ink">Ghost</span> — SOL network fee on each send
              </li>
            </ul>
          </RailBlock>

          <RailBlock title="Next">
            After funding, open{" "}
            <Link href="/app/send" className="underline underline-offset-2">
              Send
            </Link>{" "}
            and attach the note (auto-filled if saved here).
          </RailBlock>
        </>
      }
    >
      <WorkspacePanel>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 flex-1">
            <Label htmlFor="credit-amount">Top up amount</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setAmount(p)}
                  className={`h-9 border px-3 text-[13px] transition-colors ${
                    amount === p
                      ? "border-ink bg-ink text-cream"
                      : "border-ink/15 bg-cream text-ink hover:bg-sand"
                  }`}
                >
                  {p} USDC
                </button>
              ))}
            </div>
            <div className="relative mt-3 max-w-xs">
              <Input
                id="credit-amount"
                className="h-12 rounded-none border-ink/15 bg-cream pr-16 text-[20px] tracking-[-0.02em]"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                inputMode="decimal"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-ink/45">
                USDC
              </span>
            </div>
          </div>
          <Button
            size="pill"
            className="h-12 w-full shrink-0 text-[16px] sm:w-auto sm:min-w-[180px]"
            disabled={busy || !connected}
            onClick={onTopUp}
            data-testid="gas-credit-topup"
          >
            {busy ? "Confirm in wallet…" : "Buy credit"}
          </Button>
        </div>
        {!connected ? (
          <p className="mt-4 text-[13px] font-normal text-ink/50">
            Connect the funded wallet that holds USDC.
          </p>
        ) : null}
      </WorkspacePanel>

      {lastNote ? (
        <WorkspacePanel className="bg-sun/40">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-[15px] text-ink">New credit note</p>
              <p className="mt-2 break-all font-mono text-[11px] leading-relaxed text-ink/70">
                {lastNote}
              </p>
              <p className="mt-3 text-[13px] font-normal text-ink/55">
                Treat this like a bearer voucher — anyone with the note can spend the
                credit.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="shrink-0 gap-2"
              onClick={() => copyNote(lastNote)}
            >
              <Copy className="size-3.5" />
              Copy
            </Button>
          </div>
        </WorkspacePanel>
      ) : null}

      <section>
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 className="text-[15px] text-ink">Saved notes</h2>
          <span className="text-[12px] text-ink/45">Stored in this browser only</span>
        </div>

        {notes.length === 0 ? (
          <div className="border border-dashed border-ink/20 bg-paper/60 px-5 py-10 text-center">
            <p className="text-[15px] text-ink">No credits yet</p>
            <p className="mt-2 text-[13px] font-normal text-ink/50">
              Buy a credit above. The note appears here and on Send.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-ink/10 border border-ink/12 bg-paper">
            {notes.map((n) => (
              <li
                key={n.commitment}
                className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"
              >
                <div className="min-w-0">
                  <p className="text-[18px] tracking-[-0.02em] text-ink">
                    {formatUsdcRaw(n.remaining ?? n.initialAmount)}{" "}
                    <span className="text-[12px] text-ink/45">
                      / {formatUsdcRaw(n.initialAmount)} USDC
                    </span>
                  </p>
                  <p className="mt-1 truncate font-mono text-[11px] text-ink/40">
                    {shortAddr(n.commitment, 8)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    onClick={() => copyNote(n.note)}
                  >
                    <Copy className="size-3.5" />
                    Copy
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    disabled={refreshing === n.note}
                    onClick={() => refreshBalance(n.note)}
                  >
                    <RefreshCw
                      className={`size-3.5 ${refreshing === n.note ? "animate-spin" : ""}`}
                    />
                    Refresh
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AppWorkspace>
  );
}
