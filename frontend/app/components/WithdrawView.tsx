"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { withdrawWithNote } from "@/lib/ghost";

export function WithdrawView() {
  const wallet = useWallet();
  const [note, setNote] = useState("");
  const [recipient, setRecipient] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onWithdraw() {
    setError("");
    setStatus("");
    setBusy(true);
    try {
      const to = recipient.trim() || wallet.publicKey?.toBase58();
      if (!to) throw new Error("Enter a recipient address (or connect a wallet).");
      if (!note.trim()) throw new Error("Paste your Ghost Note.");

      setStatus("Fetching Merkle path…");
      setStatus("Generating ZK proof in browser (may take a few seconds)…");
      const result = await withdrawWithNote(note.trim(), to);
      setStatus(
        `Withdraw submitted with 0 SOL from the recipient.\n\nTx: ${result.signature}\n${result.explorer}`,
      );
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel">
      <h2>Withdraw (gasless)</h2>
      <p>
        Paste a Ghost Note. The relayer verifies the ZK proof off-chain and pays
        Solana fees. You need <strong>0 SOL</strong> in the recipient wallet.
      </p>

      <label htmlFor="note">Ghost Note</label>
      <textarea
        id="note"
        placeholder="ghost:v1:…"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />

      <label htmlFor="recipient">Recipient (defaults to connected wallet)</label>
      <input
        id="recipient"
        placeholder={wallet.publicKey?.toBase58() || "Solana address"}
        value={recipient}
        onChange={(e) => setRecipient(e.target.value)}
      />

      <div style={{ marginTop: "1rem" }}>
        <button className="primary" disabled={busy} onClick={onWithdraw}>
          {busy ? "Proving & relaying…" : "Generate proof & withdraw"}
        </button>
      </div>

      {status && <div className="status">{status}</div>}
      {error && <div className="status error">{error}</div>}
    </section>
  );
}
