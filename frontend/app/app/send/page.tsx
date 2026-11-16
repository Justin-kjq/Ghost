"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { PublicKey } from "@solana/web3.js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useGhostWallet } from "@/hooks/useGhostWallet";
import {
  fetchGasConfig,
  fetchMintDecimals,
  sponsoredTransfer,
  toRawAmount,
  type GasConfig,
} from "@/lib/gas";
import { listGasNotes, updateGasNoteRemaining } from "@/lib/gas-credits";
import { recordActivity } from "@/lib/activity";
import { fetchWalletTokens, type WalletToken } from "@/lib/token-balances";
import { shortAddr } from "@/lib/ghost";

const CUSTOM = "__custom__";

export default function SendPage() {
  const { publicKey, signTransaction, connected } = useGhostWallet();
  const [tokens, setTokens] = useState<WalletToken[]>([]);
  const [loadingTokens, setLoadingTokens] = useState(false);
  const [selected, setSelected] = useState<string>("");
  const [customMint, setCustomMint] = useState("");
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [gasNote, setGasNote] = useState("");
  const [showGas, setShowGas] = useState(false);
  const [busy, setBusy] = useState(false);
  const [gas, setGas] = useState<GasConfig | null>(null);
  const [result, setResult] = useState<{
    signature: string;
    explorer: string;
    creditRemaining: string;
  } | null>(null);

  const activeToken = useMemo(() => {
    if (selected === CUSTOM) return null;
    return tokens.find((t) => t.mint === selected) ?? null;
  }, [selected, tokens]);

  const mint = selected === CUSTOM ? customMint.trim() : selected;

  useEffect(() => {
    fetchGasConfig()
      .then(setGas)
      .catch(() => setGas(null));
    const stored = listGasNotes()[0];
    if (stored?.note) setGasNote(stored.note);
    else setShowGas(true);
  }, []);

  useEffect(() => {
    if (!publicKey) {
      setTokens([]);
      setSelected("");
      return;
    }
    let cancelled = false;
    setLoadingTokens(true);
    fetchWalletTokens(publicKey)
      .then((list) => {
        if (cancelled) return;
        setTokens(list);
        setSelected((prev) => {
          if (prev && (prev === CUSTOM || list.some((t) => t.mint === prev))) {
            return prev;
          }
          return list[0]?.mint ?? CUSTOM;
        });
      })
      .catch(() => {
        if (!cancelled) {
          setTokens([]);
          setSelected(CUSTOM);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingTokens(false);
      });
    return () => {
      cancelled = true;
    };
  }, [publicKey]);

  function setMax() {
    if (activeToken) setAmount(activeToken.uiAmount);
  }

  async function onSend() {
    if (!connected || !publicKey || !signTransaction) {
      toast.error("Connect a wallet first.");
      return;
    }
    if (!gasNote.trim()) {
      setShowGas(true);
      toast.error("Add a gas credit note (from Credits) so Ghost can pay the network fee.");
      return;
    }
    const recipient = to.trim();
    if (!recipient) {
      toast.error("Enter a recipient address.");
      return;
    }
    try {
      new PublicKey(recipient);
    } catch {
      toast.error("Recipient address looks invalid.");
      return;
    }
    if (!mint) {
      toast.error("Choose a token.");
      return;
    }
    try {
      new PublicKey(mint);
    } catch {
      toast.error("Token mint looks invalid.");
      return;
    }

    if (gas?.allowedMints && gas.allowedMints.length > 0) {
      if (!gas.allowedMints.includes(mint)) {
        toast.error("This token isn’t allowlisted on the relayer.");
        return;
      }
    }

    setBusy(true);
    setResult(null);
    try {
      if (gas && !gas.enabled) throw new Error("Ghost Gas is paused right now.");

      const dec =
        activeToken?.decimals ?? (await fetchMintDecimals(mint));
      const amountRaw = toRawAmount(amount, dec);
      if (amountRaw === "0") throw new Error("Enter an amount greater than zero");

      if (activeToken && BigInt(amountRaw) > BigInt(activeToken.amountRaw)) {
        throw new Error("Amount exceeds your balance");
      }

      const out = await sponsoredTransfer({
        from: publicKey.toBase58(),
        to: recipient,
        mint,
        amountRaw,
        gasNote: gasNote.trim(),
        signTransaction,
      });

      recordActivity({
        kind: "send",
        signature: out.signature,
        explorer: out.explorer,
        at: new Date().toISOString(),
        detail: `send ${amount} → ${shortAddr(recipient, 4)}`,
      });

      if (out.creditRemaining) {
        updateGasNoteRemaining(gasNote.trim(), out.creditRemaining);
      }
      setResult(out);
      setAmount("");
      toast.success("Sent");
      if (publicKey) {
        fetchWalletTokens(publicKey).then(setTokens).catch(() => undefined);
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-8">
      <header>
        <h1 className="t-48">Send</h1>
        <p className="t-14 mt-3 font-normal text-ink/55">
          Network fees are covered by your{" "}
          <Link href="/app/credits" className="underline underline-offset-2">
            gas credit
          </Link>
          . You only sign.
        </p>
      </header>

      <section className="border border-ink/15 bg-paper p-5 sm:p-6">
        <div className="space-y-5">
          <div>
            <Label htmlFor="to">To</Label>
            <Input
              id="to"
              className="mt-2 h-12 rounded-none border-ink/15 bg-cream font-mono text-sm"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="Solana address"
              autoComplete="off"
              data-testid="send-to"
            />
          </div>

          <div>
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="token">Token</Label>
              {loadingTokens && (
                <span className="text-[12px] text-ink/45">Loading balances…</span>
              )}
            </div>
            <select
              id="token"
              className="mt-2 h-12 w-full border border-ink/15 bg-cream px-3 text-[15px] text-ink outline-none"
              value={selected || CUSTOM}
              onChange={(e) => setSelected(e.target.value)}
              data-testid="send-token"
            >
              {tokens.map((t) => (
                <option key={t.mint} value={t.mint}>
                  {t.label} · {t.uiAmount}
                </option>
              ))}
              <option value={CUSTOM}>Other token (paste mint)…</option>
            </select>
            {selected === CUSTOM && (
              <Input
                className="mt-2 h-11 rounded-none border-ink/15 bg-cream font-mono text-xs"
                value={customMint}
                onChange={(e) => setCustomMint(e.target.value)}
                placeholder="Token mint address"
                data-testid="send-custom-mint"
              />
            )}
            {activeToken && (
              <p className="mt-2 text-[12px] text-ink/50">
                Balance {activeToken.uiAmount}
                <button
                  type="button"
                  className="ml-3 underline underline-offset-2"
                  onClick={setMax}
                >
                  Max
                </button>
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              className="mt-2 h-12 rounded-none border-ink/15 bg-cream text-[18px]"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              inputMode="decimal"
              data-testid="send-amount"
            />
          </div>

          <Button
            size="pill"
            className="h-12 w-full text-[17px]"
            disabled={busy || !connected}
            onClick={onSend}
            data-testid="gas-send-submit"
          >
            {busy ? "Sending…" : "Send"}
          </Button>
        </div>
      </section>

      <div className="border border-ink/10 bg-sand/60 px-4 py-3">
        <button
          type="button"
          className="flex w-full items-center justify-between text-left text-[13px] text-ink/70"
          onClick={() => setShowGas((v) => !v)}
        >
          <span>
            {gasNote.trim()
              ? "Gas credit attached"
              : "Gas credit required"}
          </span>
          <span className="text-ink/45">{showGas ? "Hide" : "Show"}</span>
        </button>
        {showGas && (
          <div className="mt-3 space-y-2">
            <Textarea
              className="rounded-none border-ink/15 bg-paper font-mono text-[11px]"
              placeholder="ghost-gas:v1:… (from Credits)"
              value={gasNote}
              onChange={(e) => setGasNote(e.target.value)}
              rows={3}
            />
            <p className="text-[12px] text-ink/50">
              Top up on{" "}
              <Link href="/app/credits" className="underline">
                Credits
              </Link>{" "}
              with your main wallet, then paste the note here (or keep it saved in this
              browser).
            </p>
          </div>
        )}
      </div>

      {result && (
        <section
          className="border border-ink/15 bg-sun/35 p-5"
          data-testid="gas-send-result"
        >
          <p className="text-[15px]">Sent</p>
          <a
            className="mt-3 block break-all font-mono text-xs underline"
            href={result.explorer}
            target="_blank"
            rel="noreferrer"
          >
            {result.signature}
          </a>
        </section>
      )}
    </div>
  );
}
