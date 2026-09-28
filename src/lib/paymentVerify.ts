/**
 * On-chain verification of subscription payments.
 *
 * The browser cache (localStorage) is treated as an *untrusted claim*: it only
 * says "this wallet says it paid with signature X". Entitlements are granted
 * only after the transaction is read back from Solana and the amount credited
 * to the treasury matches the plan price. A forged or edited cache entry fails
 * here and grants nothing.
 *
 * Known limit: a mainnet-grade solution stores the subscription in a PDA
 * written by the program in the same transaction as the payment, so no client
 * replay is needed at all. That is the next milestone; this module closes the
 * "edit localStorage, get VIP" hole in the meantime.
 */

import type { Connection } from "@solana/web3.js";
import {
  SUBSCRIPTION_PLANS,
  TREASURY_WALLET,
  USDC_MINT_DEVNET,
  getPlanUsdAmount,
  type BillingCycle,
  type SubscriptionTier,
} from "./constants";

export type PaymentAssetKind = "USDC" | "SOL";

/** A purchase claim stored in the browser, pending on-chain verification. */
export interface PaymentReceipt {
  signature: string;
  tier: SubscriptionTier;
  billingCycle: BillingCycle;
  asset: PaymentAssetKind;
  /** Plan price in USD at purchase time */
  usdAmount: number;
  /** SOL payments: quoted lamports and the Chainlink price used */
  lamports?: number;
  solUsdPrice?: number;
  createdAt: string;
}

/** What the payment flow hands back so a receipt can be verified later. */
export interface PurchaseEvidence {
  signature: string;
  asset: PaymentAssetKind;
  usdAmount: number;
  lamports?: number;
  solUsdPrice?: number;
}

export type ReceiptStatus = "verified" | "rejected" | "pending";

export type RejectReason =
  | "txFailed"
  | "payerMismatch"
  | "priceMismatch"
  | "amountTooLow"
  | "priceImplausible"
  | "noTransfer";

export interface VerifiedReceipt extends PaymentReceipt {
  status: ReceiptStatus;
  reason?: RejectReason;
  /** Confirmed on-chain time, preferred over `createdAt` when replaying */
  blockTime?: number | null;
}

/** Facts read back from the chain for a single signature. */
export interface OnChainPaymentFacts {
  succeeded: boolean;
  feePayer: string | null;
  lamportsToTreasury: number;
  usdcToTreasury: number;
  blockTime: number | null;
}

/** Tolerance for float dust when comparing USDC amounts (6 decimals). */
const USDC_EPSILON = 0.01;
/** Accept lamports slightly below quote (quote carries a 0.5% buffer). */
const LAMPORTS_TOLERANCE = 0.98;
/**
 * A recorded SOL/USD price must stay within this factor of the current feed
 * price. Wide enough for real market drift, narrow enough to reject a forged
 * receipt claiming an absurd price to pay dust for an expensive plan.
 */
const SOL_PRICE_DRIFT_FACTOR = 5;

/**
 * Read a payment transaction back from Solana.
 * Returns null when the transaction cannot be found yet (RPC lag) — callers
 * should treat that as `pending`, not as a rejection.
 */
export async function fetchPaymentFacts(
  connection: Connection,
  signature: string
): Promise<OnChainPaymentFacts | null> {
  const tx = await connection.getParsedTransaction(signature, {
    commitment: "confirmed",
    maxSupportedTransactionVersion: 0,
  });
  if (!tx || !tx.meta) return null;

  const treasury = TREASURY_WALLET.toBase58();
  const keys = tx.transaction.message.accountKeys;
  const feePayer = keys[0]?.pubkey?.toBase58() ?? null;

  const treasuryIndex = keys.findIndex((k) => k.pubkey.toBase58() === treasury);
  const lamportsToTreasury =
    treasuryIndex >= 0
      ? (tx.meta.postBalances[treasuryIndex] ?? 0) -
        (tx.meta.preBalances[treasuryIndex] ?? 0)
      : 0;

  const mint = USDC_MINT_DEVNET.toBase58();
  const tokenAmount = (
    entries: typeof tx.meta.postTokenBalances
  ): number => {
    const match = (entries ?? []).find(
      (b) => b.mint === mint && b.owner === treasury
    );
    return match?.uiTokenAmount.uiAmount ?? 0;
  };
  const usdcToTreasury =
    tokenAmount(tx.meta.postTokenBalances) -
    tokenAmount(tx.meta.preTokenBalances);

  return {
    succeeded: tx.meta.err == null,
    feePayer,
    lamportsToTreasury,
    usdcToTreasury,
    blockTime: tx.blockTime ?? null,
  };
}

/**
 * Decide whether a stored receipt actually entitles the wallet to a plan.
 * Pure function over already-fetched chain facts so it can be unit tested.
 */
export function judgeReceipt(
  receipt: PaymentReceipt,
  walletAddress: string,
  facts: OnChainPaymentFacts | null,
  currentSolUsdPrice: number | null
): VerifiedReceipt {
  const reject = (reason: RejectReason): VerifiedReceipt => ({
    ...receipt,
    status: "rejected",
    reason,
    blockTime: facts?.blockTime ?? null,
  });

  // Not indexed yet, or RPC could not answer — never grant, never condemn
  if (!facts) return { ...receipt, status: "pending" };
  if (!facts.succeeded) return reject("txFailed");
  if (facts.feePayer !== walletAddress) return reject("payerMismatch");

  const plan = SUBSCRIPTION_PLANS[receipt.tier];
  if (!plan) return reject("priceMismatch");

  // The claimed price must match the published plan price. Without this a
  // forged receipt could pair a $24 transfer with the VIP tier.
  const expectedUsd = getPlanUsdAmount(plan, receipt.billingCycle);
  if (expectedUsd <= 0) return reject("priceMismatch");
  if (Math.abs(receipt.usdAmount - expectedUsd) > USDC_EPSILON) {
    return reject("priceMismatch");
  }

  if (receipt.asset === "USDC") {
    if (facts.usdcToTreasury <= 0) return reject("noTransfer");
    if (facts.usdcToTreasury + USDC_EPSILON < expectedUsd) {
      return reject("amountTooLow");
    }
    return { ...receipt, status: "verified", blockTime: facts.blockTime };
  }

  // SOL: the transfer must cover the quote, and the quote's own SOL/USD price
  // must be internally consistent and plausible against the live feed.
  const quotedLamports = receipt.lamports ?? 0;
  const price = receipt.solUsdPrice ?? 0;
  if (quotedLamports <= 0 || price <= 0) return reject("priceImplausible");

  const quotedUsd = (quotedLamports / 1e9) * price;
  // Quote carries a +0.5% buffer, so paid USD value is never *below* the price
  if (quotedUsd < expectedUsd * LAMPORTS_TOLERANCE) {
    return reject("priceImplausible");
  }
  if (facts.lamportsToTreasury < quotedLamports * LAMPORTS_TOLERANCE) {
    return reject("amountTooLow");
  }
  if (currentSolUsdPrice != null && currentSolUsdPrice > 0) {
    const ratio = price / currentSolUsdPrice;
    if (ratio > SOL_PRICE_DRIFT_FACTOR || ratio < 1 / SOL_PRICE_DRIFT_FACTOR) {
      return reject("priceImplausible");
    }
  }

  return { ...receipt, status: "verified", blockTime: facts.blockTime };
}
