import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import { commitmentPda as sdkCommitmentPda, leafPda as sdkLeafPda, poolPda as sdkPoolPda } from "@ghost/sdk";
import idl from "../idl/ghost_pool.json";
import { PROGRAM_ID, RPC_URL } from "./config";

export function getConnection(): Connection {
  return new Connection(RPC_URL, "confirmed");
}

export function getProgram(wallet: any): Program {
  const connection = getConnection();
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  const cloned: any = structuredClone(idl);
  cloned.address = PROGRAM_ID.toBase58();
  return new Program(cloned, provider);
}

export function poolPda(mint: PublicKey): [PublicKey, number] {
  return sdkPoolPda(mint, PROGRAM_ID);
}

export function commitmentPda(commitment: number[]): [PublicKey, number] {
  return sdkCommitmentPda(commitment, PROGRAM_ID);
}

export function leafPda(mint: PublicKey, leafIndex: number): [PublicKey, number] {
  return sdkLeafPda(mint, leafIndex, PROGRAM_ID);
}
