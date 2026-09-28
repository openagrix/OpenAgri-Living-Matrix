"use client";

import { useState, useCallback } from "react";
import { useWallet, useAnchorWallet } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { getProgram, getFarmPDA, getReadonlyProgram } from "@/lib/anchor";
import type { FarmWithPubkey, RegisterFarmForm } from "@/types/openagri";

function mapFarm(publicKey: PublicKey, a: Record<string, unknown>): FarmWithPubkey {
  return {
    publicKey,
    account: {
      owner: a.owner as PublicKey,
      farmId: a.farmId as string,
      name: a.name as string,
      location: a.location as string,
      cropTypes: a.cropTypes as string,
      areaM2: a.areaM2 as number,
      createdAt: (a.createdAt as { toNumber(): number }).toNumber(),
      evidenceCount: a.evidenceCount as number,
      bump: a.bump as number,
    },
  };
}

export function useFarm() {
  const { publicKey } = useWallet();
  const anchorWallet = useAnchorWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Register a new farm — PDA: ["farm", owner, farmId] */
  const registerFarm = useCallback(
    async (form: RegisterFarmForm): Promise<string | null> => {
      if (!publicKey || !anchorWallet) {
        setError("Wallet not connected");
        return null;
      }
      setLoading(true);
      setError(null);
      try {
        const program = getProgram(anchorWallet);
        const [farmPDA] = getFarmPDA(publicKey, form.farmId);
        const cropTypesStr = form.cropTypes.join(",");

        const tx = await program.methods
          .initializeFarm(
            form.farmId,
            form.name,
            form.location,
            cropTypesStr,
            form.areaM2
          )
          .accounts({
            farmProfile: farmPDA,
            owner: publicKey,
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

  /** Check if a specific farmId already exists for the connected wallet */
  const checkFarmExists = useCallback(
    async (farmId: string): Promise<boolean> => {
      if (!publicKey) return false;
      try {
        const program = getReadonlyProgram();
        const [farmPDA] = getFarmPDA(publicKey, farmId);
        await (program.account as any).farmProfile.fetch(farmPDA);
        return true;
      } catch {
        return false;
      }
    },
    [publicKey]
  );

  /** Fetch all farms belonging to the connected wallet */
  const fetchMyFarms = useCallback(async (): Promise<FarmWithPubkey[]> => {
    if (!publicKey) return [];
    try {
      const program = getReadonlyProgram();
      const all = await (program.account as any).farmProfile.all([
        // filter by owner field (offset 8 = after discriminator)
        {
          memcmp: {
            offset: 8,
            bytes: publicKey.toBase58(),
          },
        },
      ]);
      return (all as any[])
        .map((a) => mapFarm(a.publicKey, a.account))
        .sort((a, b) => a.account.createdAt - b.account.createdAt);
    } catch {
      return [];
    }
  }, [publicKey]);

  /** Fetch a single farm by owner + farmId */
  const fetchFarmByOwnerAndId = useCallback(
    async (ownerKey: PublicKey, farmId: string): Promise<FarmWithPubkey | null> => {
      try {
        const program = getReadonlyProgram();
        const [farmPDA] = getFarmPDA(ownerKey, farmId);
        const account = await (program.account as any).farmProfile.fetch(farmPDA);
        return mapFarm(farmPDA, account);
      } catch (err) {
        throw err; // let caller distinguish not-found vs real error
      }
    },
    []
  );

  /** Fetch farms by owner (all farms of a wallet) — for farm dashboard page */
  const fetchFarmsByOwner = useCallback(
    async (ownerKey: PublicKey): Promise<FarmWithPubkey[]> => {
      try {
        const program = getReadonlyProgram();
        const all = await (program.account as any).farmProfile.all([
          {
            memcmp: {
              offset: 8,
              bytes: ownerKey.toBase58(),
            },
          },
        ]);
        return (all as any[])
          .map((a) => mapFarm(a.publicKey, a.account))
          .sort((a, b) => a.account.createdAt - b.account.createdAt);
      } catch {
        return [];
      }
    },
    []
  );

  /** Fetch ALL farms on-chain (public explorer) — no wallet needed */
  const fetchAllFarms = useCallback(async (): Promise<FarmWithPubkey[]> => {
    try {
      const program = getReadonlyProgram();
      const accounts = await (program.account as any).farmProfile.all();
      return (accounts as any[])
        .map((a) => mapFarm(a.publicKey, a.account))
        .sort((a, b) => b.account.createdAt - a.account.createdAt);
    } catch {
      return [];
    }
  }, []);

  return {
    registerFarm,
    checkFarmExists,
    fetchMyFarms,
    fetchFarmByOwnerAndId,
    fetchFarmsByOwner,
    fetchAllFarms,
    loading,
    error,
  };
}
