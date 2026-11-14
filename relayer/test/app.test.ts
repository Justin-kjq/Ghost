import assert from "node:assert/strict";
import { after, describe, it } from "node:test";
import { Keypair } from "@solana/web3.js";
import { pubkeyToRecipientField } from "@ghost/sdk";
import { buildApp } from "../src/app.js";
import { loadConfig } from "../src/config.js";
import {
  configureStore,
  replaceDeposits,
  rebuildRoots,
  getCurrentRoot,
  upsertDeposit,
} from "../src/store.js";

describe("relayer HTTP", () => {
  process.env.GHOST_RELAYER_LOG = "0";
  const cfg = {
    ...loadConfig(),
    dataDir: "/tmp/ghost-relayer-test-app",
    allowedOrigins: ["https://ghost.arnabbhowmik.in", "http://localhost:3000"],
    cluster: "devnet",
    allowMockProof: true,
  };

  it("serves /health and CORS", async () => {
    configureStore(cfg.dataDir);
    replaceDeposits([]);
    await rebuildRoots();

    const app = await buildApp(
      {
        verifyProof: async () => true,
        submitWithdraw: async () => "fake-sig",
        fetchPool: async () => ({
          address: "pool",
          authority: "a",
          relayer: "r",
          mint: "m",
          vault: "v",
          treasury: "t",
          denomination: "1000000",
          feeBps: 30,
          nextIndex: 0,
          depositCount: 0,
        }),
        syncFromChain: async () => ({ deposits: 0, nextIndex: 0, root: getCurrentRoot() }),
        fetchCommitmentRecord: async () => null,
        nullifierExists: async () => false,
      },
      cfg,
    );

    const health = await app.inject({ method: "GET", url: "/health" });
    assert.equal(health.statusCode, 200);
    const body = health.json();
    assert.equal(body.ok, true);
    assert.equal(body.service, "ghost-relayer");

    const cors = await app.inject({
      method: "OPTIONS",
      url: "/health",
      headers: {
        origin: "https://ghost.arnabbhowmik.in",
        "access-control-request-method": "GET",
      },
    });
    assert.equal(
      cors.headers["access-control-allow-origin"],
      "https://ghost.arnabbhowmik.in",
    );

    const blocked = await app.inject({
      method: "GET",
      url: "/health",
      headers: { origin: "https://evil.example" },
    });
    assert.notEqual(blocked.headers["access-control-allow-origin"], "https://evil.example");

    await app.close();
  });

  it("rejects withdraw with unknown root and accepts a matching proof", async () => {
    configureStore(cfg.dataDir);
    replaceDeposits([]);
    upsertDeposit({
      leafIndex: 0,
      commitment: "0x" + "11".repeat(32),
      createdAt: new Date().toISOString(),
    });
    await rebuildRoots();
    const root = getCurrentRoot();
    const recipient = Keypair.generate().publicKey;

    const app = await buildApp(
      {
        verifyProof: async () => true,
        submitWithdraw: async () => "5".repeat(64),
        fetchPool: async () => ({
          address: "pool",
          authority: "a",
          relayer: "r",
          mint: "m",
          vault: "v",
          treasury: "t",
          denomination: "1000000",
          feeBps: 30,
          nextIndex: 1,
          depositCount: 1,
        }),
        syncFromChain: async () => ({ deposits: 1, nextIndex: 1, root }),
        fetchCommitmentRecord: async () => ({
          commitment: Array(32).fill(0x11),
          leafIndex: 0,
        }),
        nullifierExists: async () => false,
      },
      cfg,
    );

    const bad = await app.inject({
      method: "POST",
      url: "/v1/withdraw",
      payload: {
        recipient: recipient.toBase58(),
        proof: { pi_a: ["1"], pi_b: [["1"]], pi_c: ["1"], protocol: "groth16", curve: "bn128" },
        publicSignals: ["999", "12345", pubkeyToRecipientField(recipient).toString()],
      },
    });
    assert.equal(bad.statusCode, 400);
    assert.match(bad.json().error, /root/);

    const ok = await app.inject({
      method: "POST",
      url: "/v1/withdraw",
      payload: {
        recipient: recipient.toBase58(),
        proof: { pi_a: ["1"], pi_b: [["1"]], pi_c: ["1"], protocol: "groth16", curve: "bn128" },
        publicSignals: [root, "12345", pubkeyToRecipientField(recipient).toString()],
      },
    });
    assert.equal(ok.statusCode, 200, ok.body);
    assert.ok(ok.json().signature);
    assert.ok(String(ok.json().explorer).includes("explorer.solana.com"));

    await app.close();
  });
});

after(() => {
  // store module is process-wide; nothing to reset beyond tests
});
