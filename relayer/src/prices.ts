/**
 * Live USD pricing for gas credit deposits via Jupiter swap quotes (real liquidity).
 * Credits are always denominated in USDC micro-units (6 decimals).
 */

export const WSOL_MINT = "So11111111111111111111111111111111111111112";
/** Circle USDC on Solana mainnet — quote output mint when pricing other assets. */
export const MAINNET_USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
export const MAINNET_USDT_MINT = "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB";

/** Native SOL deposit only — not wrapped-SOL SPL (that uses the SPL path). */
export function isNativeMint(mint: string): boolean {
  const m = mint.trim().toLowerCase();
  return m === "native" || m === "sol";
}

export function quoteInputMint(mint: string): string {
  return isNativeMint(mint) ? WSOL_MINT : mint.trim();
}

type QuoteResult = {
  /** USDC base units (6 decimals) before haircut. */
  usdcOutRaw: string;
  routeLabel: string;
};

/**
 * Ask Jupiter what selling `amountRaw` of `inputMint` would yield in USDC
 * against live routes (liquidity-aware).
 */
export async function quoteDepositToUsdc(params: {
  inputMint: string;
  amountRaw: string;
  /** Mint used as quote currency (usually Circle USDC or the relayer USDC_MINT). */
  outputUsdcMint: string;
  slippageBps?: number;
}): Promise<QuoteResult> {
  const inputMint = quoteInputMint(params.inputMint);
  const outputMint = params.outputUsdcMint.trim();
  const amount = params.amountRaw.trim();
  if (!/^\d+$/.test(amount) || amount === "0") {
    throw Object.assign(new Error("amount must be a positive integer"), {
      statusCode: 400,
    });
  }

  if (inputMint === outputMint) {
    return { usdcOutRaw: amount, routeLabel: "1:1 USDC" };
  }

  const slippageBps = params.slippageBps ?? 100;
  const url = new URL("https://lite-api.jup.ag/swap/v1/quote");
  url.searchParams.set("inputMint", inputMint);
  url.searchParams.set("outputMint", outputMint);
  url.searchParams.set("amount", amount);
  url.searchParams.set("slippageBps", String(slippageBps));
  url.searchParams.set("restrictIntermediateTokens", "true");

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(12_000),
    });
  } catch (e: unknown) {
    throw Object.assign(
      new Error(
        `Price quote unavailable (${e instanceof Error ? e.message : String(e)})`,
      ),
      { statusCode: 502 },
    );
  }

  if (!res.ok) {
    throw Object.assign(
      new Error("No liquid route to USDC for this asset"),
      { statusCode: 400 },
    );
  }

  const json = (await res.json()) as {
    outAmount?: string;
    routePlan?: unknown[];
  };
  const outAmount = String(json.outAmount || "");
  if (!/^\d+$/.test(outAmount) || outAmount === "0") {
    throw Object.assign(
      new Error("Jupiter returned no USDC liquidity for this size"),
      { statusCode: 400 },
    );
  }

  return {
    usdcOutRaw: outAmount,
    routeLabel: `jupiter:${(json.routePlan || []).length || 1}-hop`,
  };
}

/** Apply haircut (bps) so credits are slightly under spot (price-move buffer). */
export function applyHaircut(usdcRaw: string, haircutBps: number): string {
  const rawBps = Number.isFinite(haircutBps) ? haircutBps : 200;
  const bps = Math.max(0, Math.min(5_000, Math.floor(rawBps)));
  const v = BigInt(usdcRaw);
  const kept = (v * BigInt(10_000 - bps)) / 10_000n;
  return kept.toString();
}
