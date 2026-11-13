"use client";

import { useEffect, useState } from "react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { DepositView } from "./components/DepositView";
import { WithdrawView } from "./components/WithdrawView";
import { fetchPoolInfo } from "@/lib/ghost";

type Tab = "deposit" | "withdraw";

export default function HomePage() {
  const [tab, setTab] = useState<Tab>("deposit");
  const [pool, setPool] = useState<any>(null);
  const [poolError, setPoolError] = useState("");

  useEffect(() => {
    fetchPoolInfo()
      .then(setPool)
      .catch((e) => setPoolError(e.message));
  }, []);

  return (
    <main>
      <div className="topbar">
        <div>
          <h1 className="brand">Ghost</h1>
          <p className="tagline">
            Private USDC on Solana Devnet. Deposit a note. Withdraw gaslessly —
            ZK verified by the relayer, fees paid in SOL by Ghost.
          </p>
        </div>
        <WalletMultiButton />
      </div>

      <div className="meta">
        <div>
          <span>Network</span>
          <strong>Solana Devnet</strong>
        </div>
        <div>
          <span>Denomination</span>
          <strong>1 USDC</strong>
        </div>
        <div>
          <span>Deposits</span>
          <strong>{pool?.depositCount ?? "—"}</strong>
        </div>
        <div>
          <span>Fee</span>
          <strong>{pool ? `${pool.feeBps} bps` : "—"}</strong>
        </div>
      </div>
      {poolError && (
        <div className="status error" style={{ marginBottom: "1rem" }}>
          {poolError}
        </div>
      )}

      <div className="tabs">
        <button
          className={`tab ${tab === "deposit" ? "active" : ""}`}
          onClick={() => setTab("deposit")}
        >
          Deposit
        </button>
        <button
          className={`tab ${tab === "withdraw" ? "active" : ""}`}
          onClick={() => setTab("withdraw")}
        >
          Withdraw
        </button>
      </div>

      {tab === "deposit" ? <DepositView /> : <WithdrawView />}
    </main>
  );
}
