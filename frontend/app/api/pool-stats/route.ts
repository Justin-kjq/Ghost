import { NextResponse } from "next/server";
import { fetchPoolLiveStats } from "@/lib/pool-stats";

export const dynamic = "force-dynamic";

export async function GET() {
  const stats = await fetchPoolLiveStats();
  return NextResponse.json(stats);
}
