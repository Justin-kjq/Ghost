"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { depositUsdc } from "@/lib/ghost";

export function DepositView() {
  const wallet = useWallet();
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onDeposit() {
    setError("");
    setStatus("");
    if (!wallet.publicKey || !wallet.signTransaction) {
      setError("Connect Phantom first.");
      return;
    }
    setBusy(true);
    try {
      setStatus("Creating commitment and depositing 1 USDC…");
      const result = await depositUsdc(wallet as any);
      setStatus(
        `Deposit confirmed.\n\nTx: ${result.signature}\nLeaf: ${result.leafIndex}\n\nSAVE YOUR GHOST NOTE (private key to the funds):\n${result.note}`,
      );
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel">
      <h2>Deposit</h2>
      <p>
        Deposit exactly <strong>1 USDC</strong> into the Ghost pool. You receive a
        Ghost Note — anyone with that note can withdraw later, unlinkably.
      </p>
      <button className="primary" disabled={busy} onClick={onDeposit}>
        {busy ? "Depositing…" : "Deposit 1 USDC"}
      </button>
      {status && <div className="status">{status}</div>}
      {error && <div className="status error">{error}</div>}
    </section>
  );
}
