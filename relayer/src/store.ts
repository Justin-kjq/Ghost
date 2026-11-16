import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { writeFileAtomic } from "./atomic-write.js";
import {
  buildMerkleTree,
  getMerklePath,
  type MerklePath,
} from "@ghost/sdk";

export interface StoredDeposit {
  leafIndex: number;
  commitment: string;
  txSignature?: string;
  createdAt: string;
}

const __dirname = dirname(fileURLToPath(import.meta.url));

let memory: StoredDeposit[] = [];
let rootHistory: string[] = [];
let currentRoot = "";
let persistDir: string | null = null;

function dataFile(): string | null {
  if (!persistDir) return null;
  return join(persistDir, "deposits.json");
}

export function configureStore(dataDir?: string) {
  persistDir = dataDir && dataDir.length > 0 ? dataDir : join(__dirname, "..", "data");
}

function loadFromDisk(): StoredDeposit[] {
  const file = dataFile();
  if (!file || !existsSync(file)) return [];
  return JSON.parse(readFileSync(file, "utf8")) as StoredDeposit[];
}

function saveToDisk(deposits: StoredDeposit[]) {
  const file = dataFile();
  if (!file) return;
  writeFileAtomic(file, JSON.stringify(deposits, null, 2));
}

export function listDeposits(): StoredDeposit[] {
  return [...memory].sort((a, b) => a.leafIndex - b.leafIndex);
}

export function getDeposit(leafIndex: number): StoredDeposit | undefined {
  return memory.find((d) => d.leafIndex === leafIndex);
}

export function getCurrentRoot(): string {
  return currentRoot;
}

export function getRootHistory(): string[] {
  return [...rootHistory];
}

export function isKnownRoot(root: string): boolean {
  return rootHistory.includes(root) || root === currentRoot;
}

export function hydrateFromDisk() {
  memory = loadFromDisk();
}

export function replaceDeposits(deposits: StoredDeposit[]) {
  memory = [...deposits].sort((a, b) => a.leafIndex - b.leafIndex);
  saveToDisk(memory);
}

export function upsertDeposit(deposit: StoredDeposit): StoredDeposit {
  const idx = memory.findIndex((d) => d.leafIndex === deposit.leafIndex);
  if (idx >= 0) {
    if (
      memory[idx].commitment.toLowerCase() !== deposit.commitment.toLowerCase() &&
      memory[idx].commitment !== deposit.commitment
    ) {
      throw new Error(
        `leafIndex ${deposit.leafIndex} already registered with a different commitment`,
      );
    }
    memory[idx] = { ...memory[idx], ...deposit };
  } else {
    memory.push(deposit);
  }
  saveToDisk(memory);
  return deposit;
}

function toBigLeaves(deposits: StoredDeposit[]) {
  return deposits.map((d) => ({
    leafIndex: d.leafIndex,
    commitment: BigInt(d.commitment.startsWith("0x") ? d.commitment : "0x" + d.commitment),
  }));
}

export async function rebuildRoots(): Promise<{ root: string; history: string[] }> {
  const deposits = listDeposits();
  const history: string[] = [];
  const acc: StoredDeposit[] = [];
  const empty = await buildMerkleTree([]);
  history.push(empty.root.toString());
  for (const d of deposits) {
    acc.push(d);
    const { root } = await buildMerkleTree(toBigLeaves(acc));
    history.push(root.toString());
  }
  rootHistory = history;
  currentRoot = history[history.length - 1]!;
  return { root: currentRoot, history: rootHistory };
}

export async function merklePathFor(leafIndex: number): Promise<MerklePath> {
  const deposits = listDeposits();
  if (!getDeposit(leafIndex)) {
    throw new Error(`Unknown leafIndex ${leafIndex}`);
  }
  return getMerklePath(toBigLeaves(deposits), leafIndex);
}

export function commitmentHex(value: string | bigint | Uint8Array | number[]): string {
  if (typeof value === "bigint") {
    return "0x" + value.toString(16).padStart(64, "0");
  }
  if (typeof value === "string") {
    const h = value.startsWith("0x") ? value.slice(2) : value;
    return "0x" + h.padStart(64, "0");
  }
  let hex = "0x";
  for (const b of value) hex += Number(b).toString(16).padStart(2, "0");
  return hex;
}
