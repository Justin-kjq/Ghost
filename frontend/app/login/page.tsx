"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useGhostWallet } from "@/hooks/useGhostWallet";
import { ENABLE_DEV_WALLET } from "@/lib/config";
import { Wordmark, TurnArrow } from "@/components/landing/marks";
import { FlowDiagram } from "@/components/landing/FlowDiagram";
import { GITHUB_REPO } from "@/lib/addresses";
import { LEGAL_PAGES } from "@/lib/legal";

type Kind = "wallet" | "dev";

export default function LoginPage() {
  const router = useRouter();
  const { connected, connecting, connect, connectDevWallet } = useGhostWallet();
  const [busy, setBusy] = useState<Kind | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (connected) router.replace("/app");
  }, [connected, router]);

  async function onConnectWallet() {
    setError("");
    setBusy("wallet");
    try {
      await connect();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  async function onConnectDev() {
    setError("");
    setBusy("dev");
    try {
      await connectDevWallet();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="landing-root grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col justify-between bg-paper px-6 py-8 text-ink sm:px-12 sm:py-10">
        <Link href="/" className="w-fit">
          <Wordmark className="text-[22px] [--eye:var(--paper)]" />
        </Link>

        <div className="mx-auto w-full max-w-[420px] py-16">
          <span className="tag">Connect</span>
          <h1 className="t-48 mt-6">Welcome back.</h1>
          <p className="t-16 mt-4 font-normal leading-[1.5] text-ink/65">
            There is no password. Connect any Solana wallet (Phantom, Solflare,
            WalletConnect, and more) to deposit and withdraw shielded USDC.
          </p>

          <div className="mt-10 space-y-3">
            <button
              type="button"
              data-testid="connect-wallet"
              disabled={connecting || busy !== null}
              onClick={onConnectWallet}
              className="group inline-flex h-12 w-full items-center justify-center gap-[10px] bg-ink px-[18px] text-[18px] leading-none tracking-[-0.01em] text-cream disabled:opacity-50"
            >
              {busy === "wallet" ? "Connecting…" : "Connect wallet"}
              <TurnArrow className="h-[14px] w-[14px] transition-transform group-hover:translate-x-[3px]" />
            </button>
            {ENABLE_DEV_WALLET && (
              <button
                type="button"
                data-testid="use-dev-wallet"
                disabled={connecting || busy !== null}
                onClick={onConnectDev}
                className="inline-flex h-12 w-full items-center justify-center border border-ink/15 bg-transparent px-[18px] text-[16px] text-ink hover:bg-sand disabled:opacity-50"
              >
                {busy === "dev" ? "Connecting…" : "Use dev wallet"}
              </button>
            )}
          </div>

          {error && (
            <p className="mt-4 text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <p className="t-14 mt-10 font-normal text-ink/45">
            Powered by Reown AppKit / WalletConnect. Early pilot. Contracts not
            yet audited. Use small amounts. Ghost never holds your note.
          </p>
        </div>

        <div className="space-y-3">
          <a
            href={GITHUB_REPO}
            target="_blank"
            rel="noreferrer"
            className="t-14 block font-normal text-ink/45 hover:text-ink"
          >
            Get help on GitHub
          </a>
          <p className="t-14 flex flex-wrap gap-x-4 gap-y-2 font-normal text-ink/40">
            {LEGAL_PAGES.map((p) => (
              <Link key={p.href} href={p.href} className="hover:text-ink">
                {p.label}
              </Link>
            ))}
          </p>
          <p className="t-14 max-w-[42ch] font-normal text-ink/35">
            By connecting, you agree to the Terms and acknowledge the Risk Disclosure.
          </p>
        </div>
      </div>

      <div className="relative hidden min-h-screen overflow-hidden bg-night text-cream lg:block">
        <div className="absolute inset-0 flex flex-col justify-between p-10">
          <p className="t-16 max-w-[280px]">
            Your private, gasless
            <br />
            stablecoin rail
          </p>
          <div className="overflow-hidden">
            <FlowDiagram className="h-auto w-full min-w-[640px] opacity-95" />
          </div>
          <ul className="max-w-[300px]">
            {[
              "0 SOL in the recipient wallet",
              "Proof in about five seconds",
              "Live on Solana",
            ].map((t) => (
              <li key={t} className="t-14 border-t border-cream/20 py-3">
                {t}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
