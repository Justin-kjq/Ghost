import type { PoolLiveStats } from "@/lib/pool-stats";

export function ProductMock({ stats }: { stats: PoolLiveStats }) {
  const tvl = stats.tvlUi ? `${stats.tvlUi} USDC` : "-";
  const deposits = stats.deposits != null ? String(stats.deposits) : "-";
  return (
    <div className="rounded-2xl border border-hairline/80 bg-background/90 p-5 shadow-[0_24px_60px_-28px_rgba(22,20,18,0.45)] backdrop-blur-md">
      <p className="text-[11px] tracking-[0.18em] text-gold uppercase">Pool · Solana</p>
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <p className="text-[11px] tracking-[0.14em] text-muted-foreground uppercase">TVL</p>
          <p className="mt-1 font-serif text-2xl">{tvl}</p>
        </div>
        <div>
          <p className="text-[11px] tracking-[0.14em] text-muted-foreground uppercase">Deposits</p>
          <p className="mt-1 font-serif text-2xl">{deposits}</p>
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <span className="rounded-full bg-primary px-3 py-1.5 text-xs text-primary-foreground">
          Deposit 1 USDC
        </span>
        <span className="rounded-full border border-hairline px-3 py-1.5 text-xs">Withdraw</span>
      </div>
    </div>
  );
}
