import { Program, AnchorProvider, setProvider, Idl } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import { AnchorWallet } from "@solana/wallet-adapter-react";
import { PROGRAM_ID, SOLANA_RPC } from "./constants";

import IDL_JSON from "../idl/openagri_evidence.json";

// Anchor 0.30 reads program ID from idl.address (root level)
const IDL = {
  ...IDL_JSON,
  address: PROGRAM_ID.toBase58(),
} as unknown as Idl;

export function getConnection(): Connection {
  return new Connection(SOLANA_RPC, "confirmed");
}

export function getProvider(wallet: AnchorWallet): AnchorProvider {
  const connection = getConnection();
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
    preflightCommitment: "confirmed",
  });
  setProvider(provider);
  return provider;
}

export function getProgram(wallet: AnchorWallet): Program<Idl> {
  const provider = getProvider(wallet);
  return new Program(IDL, provider) as Program<Idl>;
}

/** Read-only program (no wallet needed) — used by public explorer */
export function getReadonlyProgram(): Program<Idl> {
  const connection = getConnection();
  const provider = new AnchorProvider(
    connection,
    // Dummy wallet — only used for reads, never signs
    {
      publicKey: PublicKey.default,
      signTransaction: async (tx) => tx,
      signAllTransactions: async (txs) => txs,
    },
    { commitment: "confirmed" }
  );
  return new Program(IDL, provider) as Program<Idl>;
}

// ─── PDA helpers ─────────────────────────────────────────────────────────────

/**
 * FarmProfile PDA: seeds = ["farm", owner, farmId]
 * Supports multiple farms per wallet.
 */
export function getFarmPDA(owner: PublicKey, farmId: string): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("farm"), owner.toBuffer(), Buffer.from(farmId)],
    PROGRAM_ID
  );
}

export function getEvidencePDA(
  farmPDA: PublicKey,
  sequence: number
): [PublicKey, number] {
  const seqBuffer = Buffer.alloc(4);
  seqBuffer.writeUInt32LE(sequence, 0);
  return PublicKey.findProgramAddressSync(
    [Buffer.from("evidence"), farmPDA.toBuffer(), seqBuffer],
    PROGRAM_ID
  );
}
