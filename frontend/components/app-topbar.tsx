"use client";

import { useEffect, useState } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { StatusPill } from "@/components/app-workspace";
import { fetchGasConfig, type GasConfig } from "@/lib/gas";
import { CLUSTER, isMainnetCluster } from "@/lib/config";

export function AppTopbar() {
  const [gas, setGas] = useState<GasConfig | null>(null);

  useEffect(() => {
    fetchGasConfig()
      .then(setGas)
      .catch(() => setGas(null));
  }, []);

  const networkLabel = isMainnetCluster()
    ? "Mainnet"
    : CLUSTER === "localnet"
      ? "Local"
      : "Solana";

  const gasTone =
    gas == null ? "warn" : gas.enabled ? "ok" : "off";
  const gasLabel =
    gas == null ? "Gas …" : gas.enabled ? "Gas live" : "Gas paused";

  const fee =
    gas?.creditFeeRaw != null
      ? `${(Number(gas.creditFeeRaw) / 1_000_000).toFixed(2)} USDC / send`
      : null;

  return (
    <div className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-ink/10 bg-cream/90 px-4 py-3 backdrop-blur-sm md:px-8">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="rounded-none border border-ink/15 bg-paper hover:bg-sand md:hidden" />
        <p className="hidden text-[13px] font-medium text-ink/55 md:block">
          Ghost Gas
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <StatusPill tone="neutral">{networkLabel}</StatusPill>
        <StatusPill tone={gasTone}>{gasLabel}</StatusPill>
        {fee ? <StatusPill tone="neutral">{fee}</StatusPill> : null}
      </div>
    </div>
  );
}
