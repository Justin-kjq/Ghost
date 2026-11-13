import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { verifyWithdrawProof, type Groth16ProofPayload } from "@ghost/sdk";

const __dirname = dirname(fileURLToPath(import.meta.url));
const vkPath = join(__dirname, "..", "zk", "verification_key.json");

export async function verifyProof(
  payload: Pick<Groth16ProofPayload, "proof" | "publicSignals">,
): Promise<boolean> {
  if (!existsSync(vkPath)) {
    if (process.env.ALLOW_MOCK_PROOF === "1") {
      console.warn("[zk] verification_key.json missing — ALLOW_MOCK_PROOF=1, skipping verify");
      return true;
    }
    throw new Error("Missing relayer/zk/verification_key.json — build circuits first");
  }
  const vk = JSON.parse(readFileSync(vkPath, "utf8"));
  return verifyWithdrawProof(payload, vk);
}
