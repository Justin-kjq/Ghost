import { PublicKey } from "@solana/web3.js";
import { pubkeyToRecipientField } from "@ghost/sdk";
import { isKnownRoot } from "./store.js";

export interface WithdrawBody {
  recipient?: string;
  proof?: unknown;
  publicSignals?: string[];
  /** @deprecated Secrets must stay in the browser. Ignored if present. */
  note?: string;
}

export function validateWithdrawInput(body: WithdrawBody): {
  recipient: PublicKey;
  publicSignals: [string, string, string];
} {
  const { recipient, proof, publicSignals } = body ?? {};
  if (!recipient || !proof || !publicSignals) {
    throw Object.assign(
      new Error("recipient, proof, publicSignals required (do not send the Ghost Note)"),
      { statusCode: 400 },
    );
  }
  if (!Array.isArray(publicSignals) || publicSignals.length < 3) {
    throw Object.assign(new Error("publicSignals must be [root, nullifierHash, recipient]"), {
      statusCode: 400,
    });
  }
  let recipientPk: PublicKey;
  try {
    recipientPk = new PublicKey(recipient);
  } catch {
    throw Object.assign(new Error("Invalid recipient pubkey"), { statusCode: 400 });
  }
  const expectedRecipient = pubkeyToRecipientField(recipientPk).toString();
  if (publicSignals[2] !== expectedRecipient) {
    throw Object.assign(
      new Error("publicSignals recipient does not match recipient"),
      { statusCode: 400 },
    );
  }
  if (!isKnownRoot(publicSignals[0])) {
    throw Object.assign(
      new Error("publicSignals root is not in the relayer Merkle root history"),
      { statusCode: 400 },
    );
  }
  if (!/^\d+$/.test(publicSignals[1]) || publicSignals[1] === "0") {
    throw Object.assign(new Error("Invalid nullifierHash public signal"), { statusCode: 400 });
  }
  return {
    recipient: recipientPk,
    publicSignals: [publicSignals[0], publicSignals[1], publicSignals[2]],
  };
}
