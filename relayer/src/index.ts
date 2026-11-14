import "dotenv/config";
import { buildApp } from "./app.js";
import { loadConfig } from "./config.js";
import { configureStore, hydrateFromDisk, rebuildRoots } from "./store.js";
import { syncFromChain } from "./sync.js";

const cfg = loadConfig();
configureStore(cfg.dataDir || undefined);
hydrateFromDisk();

const app = await buildApp({}, cfg);

try {
  const result = await syncFromChain();
  app.log.info({ result }, "Merkle tree rebuilt from chain");
} catch (err) {
  app.log.warn({ err }, "Could not sync from chain on startup — using disk cache if present");
  await rebuildRoots();
}

await app.listen({ port: cfg.port, host: cfg.host });
console.log(`Ghost relayer listening on ${cfg.host}:${cfg.port} (cluster=${cfg.cluster})`);
console.log(`Health: http://${cfg.host}:${cfg.port}/health`);
