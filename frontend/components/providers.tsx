"use client";

import { SolanaProviders } from "@/app/components/WalletProvider";
import { AppKitRouteGate } from "@/components/appkit-route-gate";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <TooltipProvider delayDuration={200}>
      <SolanaProviders>
        <AppKitRouteGate />
        {children}
        <Toaster position="top-right" />
      </SolanaProviders>
    </TooltipProvider>
  );
}
