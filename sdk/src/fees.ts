import { BPS_DENOMINATOR, DEFAULT_FEE_BPS, DENOMINATION } from "./constants";

export function computePayout(
  denomination: bigint = DENOMINATION,
  feeBps: number = DEFAULT_FEE_BPS,
): { fee: bigint; payout: bigint } {
  const fee = (denomination * BigInt(feeBps)) / BPS_DENOMINATOR;
  return { fee, payout: denomination - fee };
}
