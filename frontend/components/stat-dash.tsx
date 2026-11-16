"use client";

import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function StatDash({
  label,
  value,
  hint,
  loading,
  unavailableHint,
}: {
  label: string;
  value: string | null | undefined;
  hint?: string;
  loading?: boolean;
  unavailableHint?: string;
}) {
  const missing = value == null || value === "";
  return (
    <div className="border-t border-hairline pt-5">
      <p className="text-[11px] tracking-[0.18em] text-muted-foreground uppercase">{label}</p>
      {loading ? (
        <Skeleton className="mt-3 h-9 w-28" />
      ) : missing ? (
        <p className="mt-2 flex items-center gap-2 font-serif text-3xl">
          -
          <Tooltip>
            <TooltipTrigger asChild>
              <button type="button" className="text-muted-foreground" aria-label="Why unavailable">
                <Info className="size-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              {unavailableHint || "Live data unavailable. The relayer or RPC did not answer."}
            </TooltipContent>
          </Tooltip>
        </p>
      ) : (
        <p className={cn("mt-2 font-serif text-3xl tracking-tight")}>{value}</p>
      )}
      {hint ? <p className="mt-2 text-sm text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
