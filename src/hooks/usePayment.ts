"use client";

import { useCallback, useState } from "react";
import { SystemProgram, Transaction } from "@solana/web3.js";
import {
  createAssociatedTokenAccountIdempotentInstruction,
  createTransferCheckedInstruction,
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  TREASURY_WALLET,
  USDC_MINT_DEVNET,
  USDC_DECIMALS,
  getPlanUsdAmount,
  SUBSCRIPTION_PLANS,
  type BillingCycle,
  type SubscriptionTier,
} from "@/lib/constants";
import {
  fetchChainlinkSolUsd,
  usdToLamports,
  usdToUsdcBaseUnits,
} from "@/lib/chainlinkSolUsd";
import type { PurchaseEvidence } from "@/lib/paymentVerify";

export type PaymentAsset = "USDC" | "SOL";

export interface PaymentQuote {
  usdAmount: number;
  asset: PaymentAsset;
  usdcAmount?: number;
  solAmount?: number;
  lamports?: number;
  solUsdPrice?: number;
  feed?: string;
}

export interface PaymentResult {
  signature: string;
  quote: PaymentQuote;
}

/**
 * Carry the quote alongside the signature so the purchase can be re-verified
 * against the chain later (amount paid vs. plan price).
 */
export function toPurchaseEvidence(result: PaymentResult): PurchaseEvidence {
  return {
    signature: result.signature,
    asset: result.quote.asset,
    usdAmount: result.quote.usdAmount,
    lamports: result.quote.lamports,
    solUsdPrice: result.quote.solUsdPrice,
  };
}

export function usePayment() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buildQuote = useCallback(
    async (
      planId: SubscriptionTier,
      cycle: BillingCycle,
      asset: PaymentAsset
    ): Promise<PaymentQuote> => {
      const plan = SUBSCRIPTION_PLANS[planId];
      const usdAmount = getPlanUsdAmount(plan, cycle);
      if (usdAmount <= 0) {
        throw new Error("paymentErrors.noPaymentRequired");
      }

      if (asset === "USDC") {
        const usdcAmount = usdAmount;
        return {
          usdAmount,
          asset,
          usdcAmount,
        };
      }

      const { priceUsd, feed } = await fetchChainlinkSolUsd(connection);
      const lamports = usdToLamports(usdAmount, priceUsd);
      return {
        usdAmount,
        asset: "SOL",
        solUsdPrice: priceUsd,
        lamports,
        solAmount: lamports / 1e9,
        feed,
      };
    },
    [connection]
  );

  const pay = useCallback(
    async (
      planId: SubscriptionTier,
      cycle: BillingCycle,
      asset: PaymentAsset
    ): Promise<PaymentResult | null> => {
      if (!publicKey) {
        setError("paymentErrors.walletNotConnected");
        return null;
      }
      setLoading(true);
      setError(null);
      try {
        const quote = await buildQuote(planId, cycle, asset);
        const tx = new Transaction();

        if (asset === "USDC") {
          const amount = usdToUsdcBaseUnits(quote.usdAmount);
          const fromAta = getAssociatedTokenAddressSync(
            USDC_MINT_DEVNET,
            publicKey,
            false,
            TOKEN_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID
          );
          const toAta = getAssociatedTokenAddressSync(
            USDC_MINT_DEVNET,
            TREASURY_WALLET,
            false,
            TOKEN_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID
          );

          // Tạo ATA treasury nếu chưa có (người trả phí rent)
          tx.add(
            createAssociatedTokenAccountIdempotentInstruction(
              publicKey,
              toAta,
              TREASURY_WALLET,
              USDC_MINT_DEVNET,
              TOKEN_PROGRAM_ID,
              ASSOCIATED_TOKEN_PROGRAM_ID
            )
          );

          tx.add(
            createTransferCheckedInstruction(
              fromAta,
              USDC_MINT_DEVNET,
              toAta,
              publicKey,
              amount,
              USDC_DECIMALS,
              [],
              TOKEN_PROGRAM_ID
            )
          );
        } else {
          if (!quote.lamports) throw new Error("paymentErrors.missingLamports");
          tx.add(
            SystemProgram.transfer({
              fromPubkey: publicKey,
              toPubkey: TREASURY_WALLET,
              lamports: quote.lamports,
            })
          );
        }

        const { blockhash, lastValidBlockHeight } =
          await connection.getLatestBlockhash("confirmed");
        tx.recentBlockhash = blockhash;
        tx.feePayer = publicKey;

        const signature = await sendTransaction(tx, connection, {
          skipPreflight: false,
          preflightCommitment: "confirmed",
        });

        await connection.confirmTransaction(
          { signature, blockhash, lastValidBlockHeight },
          "confirmed"
        );

        return { signature, quote };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        // User-friendly messages
        if (/insufficient/i.test(msg) || /0x1/.test(msg)) {
          setError(
            asset === "USDC"
              ? "paymentErrors.insufficientUsdc"
              : "paymentErrors.insufficientSol"
          );
        } else if (/User rejected|rejected/i.test(msg)) {
          setError("paymentErrors.userRejected");
        } else if (/could not find account|InvalidAccountData|AccountNotFound/i.test(msg)) {
          setError("paymentErrors.usdcAccountMissing");
        } else if (msg.startsWith("paymentErrors.")) {
          setError(msg);
        } else {
          setError(msg);
        }
        return null;
      } finally {
        setLoading(false);
      }
    },
    [publicKey, connection, sendTransaction, buildQuote]
  );

  return { pay, buildQuote, loading, error, setError, connection };
}

/** Format helpers for UI */
export function formatSol(lamports: number): string {
  return `${(lamports / 1e9).toFixed(6)} SOL`;
}

export function formatUsdc(usd: number): string {
  return `${usd.toFixed(2)} USDC`;
}
