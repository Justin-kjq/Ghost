const ACTIVITY_KEY = "ghost.activity.v1";

export type ActivityItem = {
  kind: "deposit" | "withdraw" | "send";
  signature: string;
  explorer: string;
  at: string;
  detail?: string;
};

function read(): ActivityItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(ACTIVITY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ActivityItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function listActivity(): ActivityItem[] {
  return read();
}

export function recordActivity(item: ActivityItem) {
  const next = [item, ...read().filter((a) => a.signature !== item.signature)].slice(
    0,
    100,
  );
  window.localStorage.setItem(ACTIVITY_KEY, JSON.stringify(next));
}

export function explorerTx(signature: string, cluster: string) {
  if (cluster === "localnet" || cluster === "custom") return signature;
  if (cluster === "mainnet-beta" || cluster === "mainnet") {
    return `https://explorer.solana.com/tx/${signature}`;
  }
  return `https://explorer.solana.com/tx/${signature}?cluster=${cluster}`;
}
