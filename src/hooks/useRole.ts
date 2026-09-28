"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { getRole, type AppRole } from "@/lib/constants";

export function useRole(): {
  role: AppRole;
  isAdmin: boolean;
  isMember: boolean;
  isGuest: boolean;
  walletAddress: string | null;
} {
  const { publicKey } = useWallet();
  const walletAddress = publicKey?.toBase58() ?? null;
  const role = getRole(walletAddress);

  return {
    role,
    isAdmin: role === "admin",
    isMember: role === "member" || role === "admin", // admin có thể làm mọi thứ member làm
    isGuest: role === "guest",
    walletAddress,
  };
}
