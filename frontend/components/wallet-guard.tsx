"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { ENABLE_DEV_WALLET } from "@/lib/config";

export function WalletGuard({ children }: { children: React.ReactNode }) {
  const { connected, connecting } = useWallet();
  const router = useRouter();
  const [waited, setWaited] = useState(false);

  useEffect(() => {
    const ms = ENABLE_DEV_WALLET ? 1600 : 250;
    const t = window.setTimeout(() => setWaited(true), ms);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!waited) return;
    if (!connecting && !connected) router.replace("/login");
  }, [waited, connected, connecting, router]);

  if (!connected) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted-foreground">
        {connecting || !waited ? "Connecting wallet…" : "Redirecting to login…"}
      </div>
    );
  }
  return <>{children}</>;
}
