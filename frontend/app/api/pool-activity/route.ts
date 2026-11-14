import { NextResponse } from "next/server";
import { fetchPoolActivity } from "@/lib/pool-stats";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await fetchPoolActivity();
  return NextResponse.json({ rows });
}
