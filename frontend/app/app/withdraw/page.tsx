"use client";

import { useEffect, useMemo, useState } from "react";
import { Keypair } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { CLUSTER } from "@/lib/config";
import { explorerTx, recordActivity } from "@/lib/activity";
import { withdrawWithNote, type WithdrawStep } from "@/lib/ghost";
import { listNotes, markNoteSpent } from "@/lib/notes";
import { PoolSidePanel } from "@/components/pool-side-panel";

const STEPS: { id: WithdrawStep; label: string }[] = [
  { id: "path", label: "Fetch Merkle path" },
  { id: "prove", label: "Generate ZK proof in browser" },
  { id: "submit", label: "Relayer submits withdraw" },
  { id: "done", label: "Confirmed" },
];

export default function WithdrawPage() {
  const wallet = useWallet();
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
    step === "path" ? 25 : step === "prove" ? 55 : step === "submit" ? 80 : step === "done" ? 100 : 0;

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
    <div className="space-y-8">
      <div>
        <p className="text-[11px] tracking-[0.18em] text-gold uppercase">Withdraw</p>
        <h1 className="mt-1 font-serif text-4xl tracking-tight">Leave no trail of gas.</h1>
        <p className="prose-muted mt-3">
          The relayer pays Solana fees. The recipient may have a zero SOL balance.
          Use a fresh address — not the wallet that deposited.
        </p>
      </div>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.85fr)]">
        <div className="space-y-6">
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle className="font-serif">Note & recipient</CardTitle>
              <CardDescription>Proofs are generated in this browser.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="note">Ghost Note</Label>
                <Textarea
                  id="note"
                  className="mt-2 font-mono text-xs"
                  placeholder="ghost:v1:…"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
                {hasStored && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    An unspent note is stored locally under Notes. Paste it here to
                    spend it — Ghost will not copy it for you.
                  </p>
                )}
              </div>
              <div>
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="recipient">Recipient</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs"
                    data-testid="generate-fresh-address"
                    onClick={generateFreshAddress}
                  >
                    Generate fresh address
                  </Button>
                </div>
                <Input
                  id="recipient"
                  className="mt-2 font-mono text-xs"
                  placeholder="Solana address — use a fresh one"
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
                    This is your connected wallet. Withdrawing here links the deposit
                    to you. Generate a fresh address instead.
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
            </CardContent>
          </Card>

          {result && (
            <Card className="border-gold/40 shadow-none" data-testid="withdraw-result">
              <CardHeader>
                <CardTitle className="font-serif">Withdraw submitted</CardTitle>
                <CardDescription>0 SOL was required of the recipient.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="font-mono text-xs break-all">
                  Tx:{" "}
                  <a className="underline" href={result.explorer} target="_blank" rel="noreferrer">
                    {result.signature}
                  </a>
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <PoolSidePanel>
          <div>
            <p className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
              Proof steps
            </p>
            {(busy || step) && <Progress className="mt-3" value={progress} />}
            <ol className="mt-3 space-y-2 text-sm">
              {STEPS.map((s) => {
                const idx = STEPS.findIndex((x) => x.id === step);
                const mine = STEPS.findIndex((x) => x.id === s.id);
                const done = idx >= mine && step !== null;
                return (
                  <li
                    key={s.id}
                    className={done ? "text-foreground" : "text-muted-foreground"}
                  >
                    {done ? "●" : "○"} {s.label}
                  </li>
                );
              })}
            </ol>
            <p className="mt-4 text-sm text-muted-foreground">
              Privacy tip: withdraw to a fresh address that has never held a
              lamport. The relayer pays the gas.
            </p>
          </div>
        </PoolSidePanel>
      </div>
    </div>
  );
}
