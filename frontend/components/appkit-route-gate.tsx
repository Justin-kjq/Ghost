"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAppKit, useAppKitState } from "@reown/appkit/react";
import "@/lib/appkit";

/**
 * AppKit is mounted app-wide for session state, but the Connect modal must only
 * appear on /login. On mobile, reconnect / injected wallets otherwise open it
 * on landing, docs, stake, and /app routes.
 */
export function AppKitRouteGate() {
  const pathname = usePathname();
  const { close } = useAppKit();
  const { open } = useAppKitState();

  useEffect(() => {
    if (pathname === "/login") return;
    if (!open) return;
    void close();
  }, [pathname, open, close]);

  return null;
}
