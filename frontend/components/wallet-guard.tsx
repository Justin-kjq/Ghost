"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useGhostWallet } from "@/hooks/useGhostWallet";
import { ENABLE_DEV_WALLET } from "@/lib/config";

export function WalletGuard({ children }: { children: React.ReactNode }) {
  const { connected, connecting } = useGhostWallet();
  const router = useRouter();
  const [waited, setWaited] = useState(false);

  useEffect(() => {
    const ms = ENABLE_DEV_WALLET ? 1600 : 400;
    const t = window.setTimeout(() => setWaited(true), ms);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!waited) return;
    if (!connecting && !connected) router.replace("/login");
  }, [waited, connected, connecting, router]);

  if (!connected) {
    return (
      <div className="landing-root flex min-h-screen items-center justify-center bg-cream text-ink">
        <p className="t-16 text-ink/55">
          {connecting || !waited ? "Connecting wallet…" : "Redirecting to login…"}
        </p>
      </div>
    );
  }
  return <>{children}</>;
}
