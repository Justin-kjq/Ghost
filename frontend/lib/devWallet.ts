"use client";

import {
  BaseMessageSignerWalletAdapter,
  WalletName,
  WalletReadyState,
} from "@solana/wallet-adapter-base";
import {
  Keypair,
  Transaction,
  type TransactionVersion,
  VersionedTransaction,
} from "@solana/web3.js";

export const GhostDevWalletName = "Ghost Dev Wallet" as WalletName<"Ghost Dev Wallet">;

declare global {
  interface Window {
    __GHOST_DEV_WALLET__?: number[] | string;
  }
}

function keypairFromInjected(): Keypair | null {
  if (typeof window === "undefined") return null;
  const raw = window.__GHOST_DEV_WALLET__;
  if (!raw) return null;
  try {
    const arr = typeof raw === "string" ? (JSON.parse(raw) as number[]) : raw;
    if (!Array.isArray(arr) || arr.length !== 64) return null;
    return Keypair.fromSecretKey(Uint8Array.from(arr));
  } catch {
    return null;
  }
}

/**
 * Injected keypair wallet for headless / CI demos.
 * Never bake a secret into NEXT_PUBLIC_* — set window.__GHOST_DEV_WALLET__
 * (64-byte JSON array) at runtime, then connect this adapter.
 */
export class GhostDevWalletAdapter extends BaseMessageSignerWalletAdapter {
  name = GhostDevWalletName;
  url = "https://ghost.arnabbhowmik.in";
  icon =
    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMiAzMiI+PHRleHQgeT0iMjQiIGZvbnQtc2l6ZT0iMjQiPjxkPjwvQHRleHQ+PC9zdmc+";
  supportedTransactionVersions: ReadonlySet<TransactionVersion> = new Set(["legacy", 0]);

  private _keypair: Keypair | null = null;
  private _readyState: WalletReadyState = WalletReadyState.NotDetected;

  constructor() {
    super();
    if (typeof window !== "undefined" && keypairFromInjected()) {
      this._readyState = WalletReadyState.Installed;
      queueMicrotask(() => this.emit("readyStateChange", WalletReadyState.Installed));
    }
  }

  get publicKey() {
    return this._keypair?.publicKey ?? null;
  }

  get connecting() {
    return false;
  }

  get readyState() {
    if (typeof window !== "undefined" && keypairFromInjected()) {
      return WalletReadyState.Installed;
    }
    return this._readyState;
  }

  async connect() {
    const kp = keypairFromInjected();
    if (!kp) {
      throw new Error("No injected Ghost dev wallet (window.__GHOST_DEV_WALLET__)");
    }
    this._keypair = kp;
    this._readyState = WalletReadyState.Installed;
    this.emit("connect", kp.publicKey);
    console.log("[ghost] adapter connected", kp.publicKey.toBase58());
  }

  async autoConnect() {
    await this.connect();
  }

  async disconnect() {
    this._keypair = null;
    this.emit("disconnect");
  }

  async signTransaction<T extends Transaction | VersionedTransaction>(tx: T): Promise<T> {
    if (!this._keypair) throw new Error("Wallet not connected");
    if (tx instanceof Transaction) {
      tx.partialSign(this._keypair);
      return tx;
    }
    (tx as VersionedTransaction).sign([this._keypair]);
    return tx;
  }

  async signMessage(message: Uint8Array): Promise<Uint8Array> {
    if (!this._keypair) throw new Error("Wallet not connected");
    const nacl = await import("tweetnacl");
    return nacl.sign.detached(message, this._keypair.secretKey);
  }
}
