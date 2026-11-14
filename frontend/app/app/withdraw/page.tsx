"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { toast } from "sonner";
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

  const progress =
    step === "path" ? 25 : step === "prove" ? 55 : step === "submit" ? 80 : step === "done" ? 100 : 0;

  async function onWithdraw() {
    const to = recipient.trim() || wallet.publicKey?.toBase58();
    if (!to) {
      toast.error("Enter a recipient address.");
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
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <p className="text-xs tracking-[0.18em] text-gold uppercase">Withdraw</p>
        <h1 className="mt-1 font-serif text-4xl tracking-tight">Leave no trail of gas.</h1>
        <p className="mt-3 text-muted-foreground">
          The relayer pays Solana fees. The recipient may have a zero SOL balance.
        </p>
      </div>

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
            <Label htmlFor="recipient">Recipient</Label>
            <Input
              id="recipient"
              className="mt-2 font-mono text-xs"
              placeholder={wallet.publicKey?.toBase58() || "Solana address"}
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
            />
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

      {(busy || step) && (
        <div className="space-y-3">
          <Progress value={progress} />
          <ol className="space-y-2 text-sm">
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
        </div>
      )}

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
  );
}
