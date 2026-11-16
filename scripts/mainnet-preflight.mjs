#!/usr/bin/env node
/**
 * Mainnet readiness checks for Ghost Gas (no Shield).
 * Usage: node scripts/mainnet-preflight.mjs
 * Reads env from process.env (load dotenv yourself or export from .env).
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import {
  Connection,
  Keypair,
  PublicKey,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

const MAINNET_USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

function loadDotEnv() {
  const p = resolve(process.cwd(), ".env");
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 0) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    if (process.env[k] === undefined) process.env[k] = v;
  }
}

function fail(msg) {
  console.error(`FAIL  ${msg}`);
  process.exitCode = 1;
}

function ok(msg) {
  console.log(`OK    ${msg}`);
}

function warn(msg) {
  console.warn(`WARN  ${msg}`);
}

loadDotEnv();

const cluster = process.env.SOLANA_CLUSTER || process.env.NEXT_PUBLIC_CLUSTER || "";
const rpc =
  process.env.RPC_URL || process.env.NEXT_PUBLIC_RPC_URL || "";
const mintStr =
  process.env.USDC_MINT ||
  process.env.NEXT_PUBLIC_USDC_MINT ||
  MAINNET_USDC;
const keyPath =
  process.env.RELAYER_KEYPAIR_PATH || "./.keys/relayer-mainnet.json";

console.log("Ghost mainnet preflight (Gas-first)\n");

if (cluster !== "mainnet-beta" && cluster !== "mainnet") {
  fail(`SOLANA_CLUSTER/NEXT_PUBLIC_CLUSTER must be mainnet-beta (got "${cluster}")`);
} else {
  ok(`cluster=${cluster}`);
}

if (!rpc || rpc.includes("devnet") || rpc.includes("YOUR_MAINNET")) {
  fail(`Set a real mainnet RPC_URL (got "${rpc || "(empty)"}")`);
} else {
  ok(`rpc=${rpc.slice(0, 48)}${rpc.length > 48 ? "…" : ""}`);
}

if (mintStr !== MAINNET_USDC) {
  fail(`USDC_MINT must be Circle mainnet USDC ${MAINNET_USDC}`);
} else {
  ok(`usdc=${mintStr}`);
}

if (process.env.ALLOW_MOCK_PROOF === "1") {
  fail("ALLOW_MOCK_PROOF must be 0 on mainnet");
} else {
  ok("ALLOW_MOCK_PROOF=0");
}

if (process.env.NEXT_PUBLIC_ENABLE_DEV_WALLET === "true") {
  fail("NEXT_PUBLIC_ENABLE_DEV_WALLET must be false on mainnet");
} else {
  ok("dev wallet disabled");
}

if (process.env.GAS_ENABLED === "0") {
  fail("GAS_ENABLED is 0 — Ghost Gas would be offline");
} else {
  ok("GAS_ENABLED");
}

const absKey = resolve(process.cwd(), keyPath);
if (!existsSync(absKey)) {
  fail(`Relayer keypair missing: ${absKey}`);
} else {
  ok(`keypair file ${keyPath}`);
}

try {
  const connection = new Connection(rpc, "confirmed");
  const version = await connection.getVersion();
  ok(`rpc reachable (${version["solana-core"] || "ok"})`);

  const mint = new PublicKey(mintStr);
  const mintInfo = await connection.getAccountInfo(mint);
  if (!mintInfo) fail("USDC mint account not found on this RPC");
  else ok("USDC mint account exists");

  if (existsSync(absKey)) {
    const secret = JSON.parse(readFileSync(absKey, "utf8"));
    const kp = Keypair.fromSecretKey(Uint8Array.from(secret));
    const bal = await connection.getBalance(kp.publicKey);
    const sol = bal / LAMPORTS_PER_SOL;
    console.log(`      relayer=${kp.publicKey.toBase58()}  SOL=${sol.toFixed(4)}`);
    if (sol < 0.05) fail("Relayer SOL balance < 0.05 — fund feePayer before go-live");
    else if (sol < 0.5) warn("Relayer SOL < 0.5 — top up soon for sustained sponsorship");
    else ok("Relayer SOL funded");

    const ata = getAssociatedTokenAddressSync(
      mint,
      kp.publicKey,
      false,
      TOKEN_PROGRAM_ID,
    );
    const ataInfo = await connection.getAccountInfo(ata);
    if (!ataInfo) {
      warn(
        `Treasury ATA ${ata.toBase58()} missing — first X1 top-up creates it (or create now)`,
      );
    } else {
      ok(`treasury ATA ${ata.toBase58()}`);
    }
  }
} catch (e) {
  fail(`RPC/account checks failed: ${e?.message || e}`);
}

if (process.exitCode) {
  console.error("\nPreflight failed — fix the FAIL lines before docker compose up.");
  process.exit(process.exitCode);
}
console.log("\nPreflight passed. Rebuild frontend (NEXT_PUBLIC_* bake) and redeploy.");
