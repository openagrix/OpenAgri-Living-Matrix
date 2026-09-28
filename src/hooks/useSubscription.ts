"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  SUBSCRIPTION_PLANS,
  isInvestorWallet,
  isPurchasable,
  type BillingCycle,
  type SubscriptionTier,
} from "@/lib/constants";
import {
  fetchPaymentFacts,
  judgeReceipt,
  type PaymentReceipt,
  type PurchaseEvidence,
  type VerifiedReceipt,
} from "@/lib/paymentVerify";
import {
  daysRemaining as computeDaysRemaining,
  freeEntitlements,
  partnerEntitlements,
  replayReceipts,
  type Entitlements,
} from "@/lib/entitlements";
import { getConnection } from "@/lib/anchor";
import { fetchChainlinkSolUsd } from "@/lib/chainlinkSolUsd";

export interface EffectiveLimits {
  farms: number;
  evidencePerMonth: number;
}

/** Receipt cache. Untrusted: every entry is re-checked against Solana. */
const STORAGE_KEY = "openagri_receipts";
/** Pre-verification store, kept only to migrate old purchases forward. */
const LEGACY_STORAGE_KEY = "openagri_subscriptions";

type ReceiptStore = Record<string, PaymentReceipt[]>;

/**
 * Navbar, Footer, SubscriptionCard and the pricing page all mount this hook, so
 * an unshared verification pass would hit the RPC four times per page view.
 * Identical passes share one in-flight promise.
 */
const inFlight = new Map<string, Promise<VerifiedReceipt[]>>();

function passKey(wallet: string, claims: PaymentReceipt[]): string {
  return `${wallet}:${claims
    .map((c) => c.signature)
    .sort()
    .join(",")}`;
}

function readStore(): ReceiptStore {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as ReceiptStore;
  } catch {
    return {};
  }
}

function writeStore(data: ReceiptStore) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* quota / private mode — verification still works from chain next time */
  }
}

/**
 * Old records stored a single subscription per wallet with one payment
 * signature. Convert that signature into a receipt so genuine past purchases
 * survive; anything without a signature is dropped rather than trusted.
 */
function migrateLegacyReceipts(walletAddress: string): PaymentReceipt[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return [];
    const all = JSON.parse(raw) as Record<
      string,
      {
        tier?: SubscriptionTier;
        billingCycle?: BillingCycle;
        paymentTxSig?: string;
        startedAt?: string;
      }
    >;
    const legacy = all[walletAddress];
    const sig = legacy?.paymentTxSig;
    if (!legacy?.tier || !sig || sig.startsWith("env:")) return [];
    const plan = SUBSCRIPTION_PLANS[legacy.tier];
    if (!plan || !isPurchasable(plan)) return [];
    const cycle: BillingCycle = legacy.billingCycle ?? "monthly";
    return [
      {
        signature: sig,
        tier: legacy.tier,
        billingCycle: cycle,
        // Asset/amount are unknown for legacy rows; verification will reject
        // them unless the on-chain USDC transfer matches the plan price.
        asset: "USDC",
        usdAmount: plan.priceLifetime ?? (cycle === "yearly" ? plan.priceYearly : plan.priceMonthly),
        createdAt: legacy.startedAt ?? new Date().toISOString(),
      },
    ];
  } catch {
    return [];
  }
}

export type { PurchaseEvidence };

/**
 * Read every claim back from Solana and judge it.
 *
 * Known limit: the Devnet ledger is pruned, so an older transaction can come
 * back as "not found" and stay `pending` — indistinguishable from a signature
 * that never existed. We refuse to grant on `pending` rather than reopen the
 * "edit the cache, get VIP" hole. The durable fix is a subscription PDA written
 * by the program in the same transaction as the payment.
 */
async function runVerificationPass(
  wallet: string,
  claims: PaymentReceipt[]
): Promise<VerifiedReceipt[]> {
  const connection = getConnection();

  // One price read per pass; only needed to sanity-check SOL quotes
  let currentSolUsd: number | null = null;
  if (claims.some((c) => c.asset === "SOL")) {
    try {
      currentSolUsd = (await fetchChainlinkSolUsd(connection)).priceUsd;
    } catch {
      currentSolUsd = null;
    }
  }

  return Promise.all(
    claims.map(async (claim) => {
      try {
        const facts = await fetchPaymentFacts(connection, claim.signature);
        return judgeReceipt(claim, wallet, facts, currentSolUsd);
      } catch {
        // An RPC failure must not silently revoke a paid plan
        return { ...claim, status: "pending" as const };
      }
    })
  );
}

export function useSubscription(walletAddress: string | null | undefined) {
  const [receipts, setReceipts] = useState<VerifiedReceipt[]>([]);
  const [entitlements, setEntitlements] = useState<Entitlements>(freeEntitlements());
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const verifyToken = useRef(0);

  const isPartnerWallet = isInvestorWallet(walletAddress);

  /** Re-read every cached receipt from Solana and recompute entitlements. */
  const verifyAll = useCallback(
    async (wallet: string, claims: PaymentReceipt[]) => {
      const token = ++verifyToken.current;
      if (claims.length === 0) {
        setReceipts([]);
        setEntitlements(freeEntitlements());
        setVerifying(false);
        setLoading(false);
        return;
      }

      setVerifying(true);

      const key = passKey(wallet, claims);
      let pass = inFlight.get(key);
      if (!pass) {
        pass = runVerificationPass(wallet, claims).finally(() => {
          inFlight.delete(key);
        });
        inFlight.set(key, pass);
      }
      const judged = await pass;

      if (token !== verifyToken.current) return;
      setReceipts(judged);
      setEntitlements(replayReceipts(judged));
      setVerifying(false);
      setLoading(false);
    },
    []
  );

  useEffect(() => {
    if (!walletAddress) {
      verifyToken.current++;
      setReceipts([]);
      setEntitlements(freeEntitlements());
      setLoading(false);
      return;
    }

    const store = readStore();
    let claims = store[walletAddress] ?? [];

    if (claims.length === 0) {
      const migrated = migrateLegacyReceipts(walletAddress);
      if (migrated.length > 0) {
        claims = migrated;
        writeStore({ ...store, [walletAddress]: migrated });
      }
    }

    setLoading(true);
    void verifyAll(walletAddress, claims);
  }, [walletAddress, verifyAll]);

  /**
   * Record a purchase. The receipt only becomes an entitlement once the
   * transaction is confirmed on-chain and its amount matches the plan price.
   */
  const subscribe = useCallback(
    (
      newTier: SubscriptionTier,
      billingCycle: BillingCycle,
      evidence: PurchaseEvidence | string | undefined
    ) => {
      if (!walletAddress || newTier === "free") return;
      if (!isPurchasable(SUBSCRIPTION_PLANS[newTier])) return;
      if (!evidence) return;

      const plan = SUBSCRIPTION_PLANS[newTier];
      const detail: PurchaseEvidence =
        typeof evidence === "string"
          ? {
              signature: evidence,
              asset: "USDC",
              usdAmount:
                plan.priceLifetime ??
                (billingCycle === "yearly" ? plan.priceYearly : plan.priceMonthly),
            }
          : evidence;

      const receipt: PaymentReceipt = {
        signature: detail.signature,
        tier: newTier,
        billingCycle,
        asset: detail.asset,
        usdAmount: detail.usdAmount,
        lamports: detail.lamports,
        solUsdPrice: detail.solUsdPrice,
        createdAt: new Date().toISOString(),
      };

      const store = readStore();
      const existing = (store[walletAddress] ?? []).filter(
        (r) => r.signature !== receipt.signature
      );
      const next = [...existing, receipt];
      writeStore({ ...store, [walletAddress]: next });
      void verifyAll(walletAddress, next);
    },
    [walletAddress, verifyAll]
  );

  const cancelSubscription = useCallback(() => {
    if (!walletAddress) return;
    const store = readStore();
    delete store[walletAddress];
    writeStore(store);
    verifyToken.current++;
    setReceipts([]);
    setEntitlements(freeEntitlements());
  }, [walletAddress]);

  const active = useMemo(() => {
    if (isPartnerWallet) return partnerEntitlements();
    return entitlements;
  }, [entitlements, isPartnerWallet]);

  const effectiveLimits: EffectiveLimits = useMemo(
    () => ({ farms: active.farms, evidencePerMonth: active.evidence }),
    [active]
  );

  const isInvestor = isPartnerWallet;
  const isVip = active.isVip && !isInvestor;
  const tier: SubscriptionTier = isInvestor ? "investor" : active.tier;
  const plan = SUBSCRIPTION_PLANS[tier];
  const hidePricing = isVip || isInvestor;

  const daysRemaining = useMemo(
    () => (isInvestor ? null : computeDaysRemaining(active)),
    [active, isInvestor]
  );

  /** Receipts the wallet claims but the chain does not back. */
  const rejectedReceipts = useMemo(
    () => receipts.filter((r) => r.status === "rejected"),
    [receipts]
  );
  const pendingReceipts = useMemo(
    () => receipts.filter((r) => r.status === "pending"),
    [receipts]
  );

  const canAddFarm = useCallback(
    (currentFarmCount: number) => {
      const limit = effectiveLimits.farms;
      return limit === -1 || currentFarmCount < limit;
    },
    [effectiveLimits]
  );

  const canSubmitEvidence = useCallback(
    (evidenceCount: number) => {
      const limit = effectiveLimits.evidencePerMonth;
      return limit === -1 || evidenceCount < limit;
    },
    [effectiveLimits]
  );

  return {
    /** Verified entitlement state (replaces the old trusted-cache object) */
    entitlements: active,
    receipts,
    rejectedReceipts,
    pendingReceipts,
    tier,
    plan,
    loading,
    verifying,
    daysRemaining,
    effectiveLimits,
    isVip,
    isInvestor,
    hidePricing,
    isActive: tier !== "free" || isInvestor,
    subscribe,
    cancelSubscription,
    canAddFarm,
    canSubmitEvidence,
  };
}
