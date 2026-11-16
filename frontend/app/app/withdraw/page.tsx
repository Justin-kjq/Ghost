"use client";

import { useEffect, useMemo, useState } from "react";
import { redirect } from "next/navigation";
import { Keypair } from "@solana/web3.js";
import { toast } from "sonner";
import { useGhostWallet } from "@/hooks/useGhostWallet";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { CLUSTER, SHIELD_ENABLED } from "@/lib/config";
import { explorerTx, recordActivity } from "@/lib/activity";
import { withdrawWithNote, type WithdrawStep } from "@/lib/ghost";
import { listNotes, markNoteSpent } from "@/lib/notes";
import { PageHeader } from "@/components/page-header";

const STEPS: { id: WithdrawStep; label: string }[] = [
  { id: "path", label: "Fetch Merkle path" },
  { id: "prove", label: "Generate ZK proof" },
  { id: "submit", label: "Relayer submits" },
  { id: "done", label: "Confirmed" },
];

export default function WithdrawPage() {
  if (!SHIELD_ENABLED) redirect("/app/send");
  const wallet = useGhostWallet();
  const [note, setNote] = useState("");
  const [hasStored, setHasStored] = useState(false);
  useEffect(() => {
    setHasStored(!!listNotes().find((n) => !n.spent));
  }, []);
  const [recipient, setRecipient] = useState("");
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState<WithdrawStep | null>(null);
  const [result, setResult] = useState<{ signature: string; explorer: string } | null>(
    null,
  );

  const connectedAddr = wallet.publicKey?.toBase58() ?? "";
  const sameAsWallet = useMemo(() => {
    const to = recipient.trim();
    return Boolean(to && connectedAddr && to === connectedAddr);
  }, [recipient, connectedAddr]);

  const progress =
    step === "path"
      ? 25
      : step === "prove"
        ? 55
        : step === "submit"
          ? 80
          : step === "done"
            ? 100
            : 0;

  function generateFreshAddress() {
    const kp = Keypair.generate();
    const pubkey = kp.publicKey.toBase58();
    const blob = new Blob([JSON.stringify(Array.from(kp.secretKey))], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ghost-recipient-${pubkey.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setRecipient(pubkey);
    toast.success("Fresh address filled. Secret key downloaded — keep it offline.");
  }

  async function onWithdraw() {
    const to = recipient.trim();
    if (!to) {
      toast.error("Enter a recipient address — preferably a fresh one.");
      return;
    }
    if (!note.trim()) {
      toast.error("Paste a Ghost Note.");
      return;
    }
    setBusy(true);
    setResult(null);
    try {
      const out = await withdrawWithNote(note.trim(), to, setStep);
      markNoteSpent(note.trim(), out.signature);
      recordActivity({
        kind: "withdraw",
        signature: out.signature,
        explorer: out.explorer || explorerTx(out.signature, CLUSTER),
        at: new Date().toISOString(),
        detail: `to ${to}`,
      });
      setResult(out);
      toast.success("Withdraw submitted with 0 SOL from the recipient.");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-10">
      <PageHeader
        tag="Withdraw"
        title="Leave no trail of gas."
        description="Paste a Ghost Note and a recipient. The relayer pays fees — the recipient needs 0 SOL."
      />

      <section className="border border-ink/15 bg-paper p-6 md:p-8">
        <div className="space-y-5">
          <div>
            <Label htmlFor="note">Ghost Note</Label>
            <Textarea
              id="note"
              className="mt-2 rounded-none border-ink/15 bg-cream font-mono text-xs"
              placeholder="ghost:v1:…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            {hasStored && (
              <p className="mt-2 text-xs text-ink/50">
                An unspent note is stored under Notes.
              </p>
            )}
          </div>
          <div>
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="recipient">Recipient</Label>
              <button
                type="button"
                data-testid="generate-fresh-address"
                className="text-xs underline-offset-2 hover:underline"
                onClick={generateFreshAddress}
              >
                Generate fresh address
              </button>
            </div>
            <Input
              id="recipient"
              className="mt-2 rounded-none border-ink/15 bg-cream font-mono text-xs"
              placeholder="Solana address"
              autoComplete="off"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
            />
            {sameAsWallet && (
              <p
                className="mt-2 flex items-start gap-2 text-xs text-destructive"
                data-testid="same-wallet-warning"
                role="alert"
              >
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                This is your connected wallet. Use a fresh address instead.
              </p>
            )}
          </div>
          <Button
            size="pill"
            className="w-full"
            disabled={busy}
            onClick={onWithdraw}
            data-testid="withdraw-submit"
          >
            {busy ? "Proving & relaying…" : "Generate proof & withdraw"}
          </Button>
        </div>
      </section>

      {(busy || step) && (
        <section className="border border-ink/15 bg-sand p-6">
          <Progress
            className="h-1 rounded-none bg-ink/10 [&>div]:rounded-none [&>div]:bg-ink"
            value={progress}
          />
          <ol className="mt-4 space-y-0 text-sm">
            {STEPS.map((s) => {
              const idx = STEPS.findIndex((x) => x.id === step);
              const mine = STEPS.findIndex((x) => x.id === s.id);
              const done = idx >= mine && step !== null;
              return (
                <li
                  key={s.id}
                  className={`border-t border-ink/10 py-3 first:border-0 ${done ? "text-ink" : "text-ink/45"}`}
                >
                  <span className="font-mono text-[11px] tracking-[0.08em]">
                    {String(mine + 1).padStart(2, "0")}
                  </span>{" "}
                  {s.label}
                </li>
              );
            })}
          </ol>
        </section>
      )}

      {result && (
        <section className="border border-ink/15 bg-sun/35 p-6 md:p-8" data-testid="withdraw-result">
          <span className="tag">Withdraw submitted</span>
          <p className="mt-4 break-all font-mono text-xs">
            Tx:{" "}
            <a className="underline" href={result.explorer} target="_blank" rel="noreferrer">
              {result.signature}
            </a>
          </p>
        </section>
      )}
    </div>
  );
}
