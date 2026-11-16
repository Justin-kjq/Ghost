"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/page-header";
import { useGhostWallet } from "@/hooks/useGhostWallet";
import { USDC_MINT_STR } from "@/lib/config";
import { DEVNET } from "@/lib/addresses";
import {
  fetchGasConfig,
  fetchMintDecimals,
  sponsoredTransfer,
  toRawAmount,
  type GasConfig,
} from "@/lib/gas";
import { listGasNotes, updateGasNoteRemaining } from "@/lib/gas-credits";
import { recordActivity } from "@/lib/activity";
import Link from "next/link";

export default function SendPage() {
  const { publicKey, signTransaction, connected } = useGhostWallet();
  const [mint, setMint] = useState(USDC_MINT_STR || DEVNET.mint);
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [gasNote, setGasNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [gas, setGas] = useState<GasConfig | null>(null);
  const [result, setResult] = useState<{
    signature: string;
    explorer: string;
    creditRemaining: string;
  } | null>(null);

  useEffect(() => {
    fetchGasConfig()
      .then(setGas)
      .catch(() => setGas(null));
    const stored = listGasNotes()[0];
    if (stored?.note) setGasNote(stored.note);
  }, []);

  async function onSend() {
    if (!connected || !publicKey || !signTransaction) {
      toast.error("Connect the empty / low-SOL wallet (X2) first.");
      return;
    }
    if (!gasNote.trim()) {
      toast.error("Paste a gas note from an X1 top-up.");
      return;
    }
    const recipient = to.trim();
    if (!recipient) {
      toast.error("Enter a recipient address.");
      return;
    }
    if (!mint.trim()) {
      toast.error("Enter a token mint.");
      return;
    }
    setBusy(true);
    setResult(null);
    try {
      if (gas && !gas.enabled) {
        throw new Error("Ghost Gas is disabled on the relayer.");
      }
      const decimals = await fetchMintDecimals(mint.trim());
      const amountRaw = toRawAmount(amount, decimals);
      if (amountRaw === "0") throw new Error("Amount must be greater than zero");

      toast.message("Sponsoring transfer (debiting gas note)…");
      const out = await sponsoredTransfer({
        from: publicKey.toBase58(),
        to: recipient,
        mint: mint.trim(),
        amountRaw,
        gasNote: gasNote.trim(),
        signTransaction,
      });

      recordActivity({
        kind: "send",
        signature: out.signature,
        explorer: out.explorer,
        at: new Date().toISOString(),
        detail: `gas send → ${recipient.slice(0, 8)}…`,
      });

      if (out.creditRemaining) {
        updateGasNoteRemaining(gasNote.trim(), out.creditRemaining);
      }
      setResult(out);
      toast.success("Sent. Ghost paid SOL; gas note was debited.");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-10">
      <PageHeader
        tag="Ghost Gas"
        title="Send without SOL."
        description="Connect X2 (token wallet). Paste the gas note from X1’s top-up. You sign the transfer — Ghost pays SOL and charges the note."
      />

      <p className="t-14 font-normal text-ink/55">
        Need credits?{" "}
        <Link href="/app/credits" className="underline">
          Top up with X1
        </Link>
        {gas?.creditFeeRaw != null && (
          <>
            {" "}
            · ~{(Number(gas.creditFeeRaw) / 1_000_000).toFixed(4)} USDC per send
          </>
        )}
      </p>

      <section className="border border-ink/15 bg-paper p-6 md:p-8">
        <div className="space-y-5">
          <div>
            <Label htmlFor="gas-note">Gas note (from X1)</Label>
            <Textarea
              id="gas-note"
              className="mt-2 rounded-none border-ink/15 bg-cream font-mono text-xs"
              placeholder="ghost-gas:v1:…"
              value={gasNote}
              onChange={(e) => setGasNote(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="mint">Token mint</Label>
            <Input
              id="mint"
              className="mt-2 rounded-none border-ink/15 bg-cream font-mono text-xs"
              value={mint}
              onChange={(e) => setMint(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              className="mt-2 rounded-none border-ink/15 bg-cream"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="1.0"
              inputMode="decimal"
            />
          </div>
          <div>
            <Label htmlFor="to">Recipient</Label>
            <Input
              id="to"
              className="mt-2 rounded-none border-ink/15 bg-cream font-mono text-xs"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="Destination Solana address"
              autoComplete="off"
            />
          </div>
          <Button
            size="pill"
            className="w-full"
            disabled={busy || !connected}
            onClick={onSend}
            data-testid="gas-send-submit"
          >
            {busy ? "Sponsoring…" : "Sign & send (debit note + Ghost pays gas)"}
          </Button>
        </div>
      </section>

      {result && (
        <section className="border border-ink/15 bg-sun/35 p-6 md:p-8" data-testid="gas-send-result">
          <span className="tag">Transfer submitted</span>
          <p className="mt-4 break-all font-mono text-xs">
            Tx:{" "}
            <a className="underline" href={result.explorer} target="_blank" rel="noreferrer">
              {result.signature}
            </a>
          </p>
          {result.creditRemaining && (
            <p className="mt-3 t-14 font-normal text-ink/65">
              Credit remaining: {result.creditRemaining} base units
            </p>
          )}
        </section>
      )}
    </div>
  );
}
