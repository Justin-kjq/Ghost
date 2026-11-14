"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { PhantomWalletName } from "@solana/wallet-adapter-phantom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ENABLE_DEV_WALLET } from "@/lib/config";
import { GhostDevWalletName } from "@/lib/devWallet";

type Kind = "phantom" | "dev";

export default function LoginPage() {
  const router = useRouter();
  const { connected, connecting, connect, select, wallet } = useWallet();
  const [busy, setBusy] = useState<Kind | null>(null);
  const [error, setError] = useState("");
  const pending = useRef<Kind | null>(null);

  useEffect(() => {
    if (connected) router.replace("/app");
  }, [connected, router]);

  useEffect(() => {
    const kind = pending.current;
    if (!kind || !wallet) return;
    const expected = kind === "dev" ? GhostDevWalletName : PhantomWalletName;
    if (wallet.adapter.name !== expected) return;
    pending.current = null;
    const t = window.setTimeout(() => {
      connect()
        .catch((e: unknown) => {
          setError(e instanceof Error ? e.message : String(e));
        })
        .finally(() => setBusy(null));
    }, 200);
    return () => window.clearTimeout(t);
  }, [wallet, connect]);

  function connectNamed(
    name: typeof PhantomWalletName | typeof GhostDevWalletName,
    kind: Kind,
  ) {
    setError("");
    setBusy(kind);
    pending.current = kind;
    if (wallet?.adapter.name === name) {
      pending.current = null;
      window.setTimeout(() => {
        connect()
          .catch((e: unknown) => {
            setError(e instanceof Error ? e.message : String(e));
          })
          .finally(() => setBusy(null));
      }, 200);
      return;
    }
    select(name);
  }

  return (
    <div className="grid min-h-screen bg-login-canvas lg:grid-cols-2">
      <div className="flex flex-col justify-between px-8 py-8 text-login-text sm:px-14 sm:py-10">
        <Link href="/" className="font-serif text-2xl tracking-tight">
          Ghost
        </Link>

        <div className="mx-auto w-full max-w-sm py-16">
          <h1 className="font-serif text-4xl tracking-tight">Welcome back.</h1>
          <p className="mt-3 text-sm leading-relaxed text-login-text/65">
            There is no password. Connect a wallet to deposit and withdraw
            shielded USDC on Devnet.
          </p>

          <div className="mt-8 space-y-3">
            <Button
              size="pill"
              className="h-12 w-full bg-login-text text-login-canvas hover:bg-login-text/90"
              disabled={connecting || busy !== null}
              data-testid="connect-wallet"
              onClick={() => connectNamed(PhantomWalletName, "phantom")}
            >
              {busy === "phantom" ? "Connecting…" : "Connect wallet"}
            </Button>
            {ENABLE_DEV_WALLET && (
              <Button
                size="pill"
                variant="outline"
                className="h-12 w-full rounded-full border-login-text/20 bg-transparent text-login-text hover:bg-login-text/10"
                disabled={connecting || busy !== null}
                data-testid="use-dev-wallet"
                onClick={() => connectNamed(GhostDevWalletName, "dev")}
              >
                {busy === "dev" ? "Connecting…" : "Use dev wallet"}
              </Button>
            )}
          </div>

          {error && (
            <p className="mt-4 text-sm text-red-300" role="alert">
              {error}
            </p>
          )}

          <div className="mt-10 space-y-2">
            <Label htmlFor="email" className="text-login-text/50">
              Get updates (optional)
            </Label>
            <Input
              id="email"
              type="email"
              disabled
              placeholder="No mailing list in this MVP"
              className="border-login-text/15 bg-login-surface text-login-text/50"
            />
          </div>
        </div>

        <p className="text-xs text-login-text/40">
          By connecting you use Solana Devnet. Ghost never holds your note.
        </p>
      </div>

      <div className="relative hidden min-h-screen overflow-hidden bg-black lg:block">
        <Image
          src="/art/login-columns.webp"
          alt="Stippled classical columns"
          fill
          priority
          className="object-cover"
          sizes="50vw"
        />
      </div>
    </div>
  );
}
