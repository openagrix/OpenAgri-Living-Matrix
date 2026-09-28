"use client";

import { useState, useCallback } from "react";
import { useWallet, useAnchorWallet } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { getProgram, getEvidencePDA, getReadonlyProgram } from "@/lib/anchor";
import { sha256, buildEvidencePayload } from "@/lib/hash";
import type { EvidenceWithPubkey, SubmitEvidenceForm, EvidenceTypeKey } from "@/types/openagri";

function toAnchorEvidenceType(key: EvidenceTypeKey): Record<string, Record<string, never>> {
  const map: Record<EvidenceTypeKey, Record<string, Record<string, never>>> = {
    Harvest:      { harvest: {} },
    Soil:         { soil: {} },
    Carbon:       { carbon: {} },
    Water:        { water: {} },
    Biodiversity: { biodiversity: {} },
    HoneyQuality: { honeyQuality: {} },
    ProduceQuality: { produceQuality: {} },
  };
  return map[key];
}

function mapEvidence(r: { publicKey: PublicKey; account: Record<string, unknown> }): EvidenceWithPubkey {
  const a = r.account;
  return {
    publicKey: r.publicKey,
    account: {
      farm: a.farm as PublicKey,
      submitter: a.submitter as PublicKey,
      evidenceType: a.evidenceType as EvidenceWithPubkey["account"]["evidenceType"],
      dataHash: a.dataHash as number[],
      ipfsCid: a.ipfsCid as string,
      summary: a.summary as string,
      quantity: (a.quantity as { toNumber(): number }).toNumber(),
      unit: a.unit as string,
      eventTimestamp: (a.eventTimestamp as { toNumber(): number }).toNumber(),
      submittedAt: (a.submittedAt as { toNumber(): number }).toNumber(),
      sequence: a.sequence as number,
      bump: a.bump as number,
    },
  };
}

export function useEvidence() {
  const { publicKey } = useWallet();
  const anchorWallet = useAnchorWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Submit evidence. farmPDA must be provided by caller. */
  const submitEvidence = useCallback(
    async (farmPDA: PublicKey, form: SubmitEvidenceForm): Promise<string | null> => {
      if (!publicKey || !anchorWallet) {
        setError("Wallet not connected");
        return null;
      }
      setLoading(true);
      setError(null);
      try {
        const program = getProgram(anchorWallet);

        const farmAccount = await (program.account as any).farmProfile.fetch(farmPDA);
        const nextSeq: number = (farmAccount.evidenceCount as number) + 1;
        const [evidencePDA] = getEvidencePDA(farmPDA, nextSeq);

        let payload = "{}";
        try { payload = buildEvidencePayload(JSON.parse(form.rawData || "{}")); } catch { /* ignore */ }
        const hashBytes = await sha256(payload);
        const dataHash = Array.from(hashBytes);
        const eventTimestamp = Math.floor(new Date(form.eventDate).getTime() / 1000);

        const tx = await program.methods
          .submitEvidence(
            nextSeq,
            toAnchorEvidenceType(form.evidenceType),
            dataHash,
            form.ipfsCid || "",
            form.summary,
            new BN(form.quantity),
            form.unit,
            new BN(eventTimestamp)
          )
          .accounts({
            evidenceRecord: evidencePDA,
            farmProfile: farmPDA,
            submitter: publicKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc();
        return tx;
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        return null;
      } finally {
        setLoading(false);
      }
    },
    [publicKey, anchorWallet]
  );

  /** Fetch evidence records for a specific farm PDA */
  const fetchEvidenceForFarm = useCallback(
    async (farmPDA: PublicKey): Promise<EvidenceWithPubkey[]> => {
      try {
        const program = getReadonlyProgram();
        const records = await (program.account as any).evidenceRecord.all([
          { memcmp: { offset: 8, bytes: farmPDA.toBase58() } },
        ]);
        return (records as any[])
          .map((r) => mapEvidence(r))
          .sort((a, b) => b.account.sequence - a.account.sequence);
      } catch {
        return [];
      }
    },
    []
  );

  /** Fetch all evidence across all farms (global explorer) */
  const fetchAllEvidence = useCallback(async (): Promise<EvidenceWithPubkey[]> => {
    try {
      const program = getReadonlyProgram();
      const records = await (program.account as any).evidenceRecord.all();
      return (records as any[])
        .map((r) => mapEvidence(r))
        .sort((a, b) => b.account.submittedAt - a.account.submittedAt);
    } catch {
      return [];
    }
  }, []);

  return { submitEvidence, fetchEvidenceForFarm, fetchAllEvidence, loading, error };
}
