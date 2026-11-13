import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export interface StoredDeposit {
  leafIndex: number;
  commitment: string;
  txSignature?: string;
  createdAt: string;
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, "..", "data");
const dataFile = join(dataDir, "deposits.json");

function load(): StoredDeposit[] {
  if (!existsSync(dataFile)) return [];
  return JSON.parse(readFileSync(dataFile, "utf8")) as StoredDeposit[];
}

function save(deposits: StoredDeposit[]) {
  mkdirSync(dataDir, { recursive: true });
  writeFileSync(dataFile, JSON.stringify(deposits, null, 2));
}

export function listDeposits(): StoredDeposit[] {
  return load().sort((a, b) => a.leafIndex - b.leafIndex);
}

export function upsertDeposit(deposit: StoredDeposit): StoredDeposit {
  const all = load();
  const idx = all.findIndex((d) => d.leafIndex === deposit.leafIndex);
  if (idx >= 0) all[idx] = deposit;
  else all.push(deposit);
  save(all);
  return deposit;
}

export function getDeposit(leafIndex: number): StoredDeposit | undefined {
  return load().find((d) => d.leafIndex === leafIndex);
}
