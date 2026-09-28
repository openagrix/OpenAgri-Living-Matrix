/**
 * Entitlement replay: turn a list of verified payment receipts into the quotas
 * a wallet may use. Pure and deterministic — no storage, no network — so the
 * rules that decide "how many farms can this wallet register" are unit testable
 * and identical everywhere they run.
 */

import {
  SUBSCRIPTION_PLANS,
  type BillingCycle,
  type SubscriptionTier,
} from "./constants";
import type { VerifiedReceipt } from "./paymentVerify";

export const MS_PER_DAY = 1000 * 60 * 60 * 24;

export interface Entitlements {
  /** Display tier — highest tier ever granted and still active */
  tier: SubscriptionTier;
  farms: number;
  evidence: number;
  /** null = no expiry (lifetime combo) */
  expiresAt: string | null;
  startedAt: string | null;
  isVip: boolean;
  totalDaysGranted: number;
  /** Signatures that produced these entitlements (audit trail) */
  signatures: string[];
}

const TIER_RANK: Record<SubscriptionTier, number> = {
  free: 0,
  monthly: 1,
  yearly: 2,
  combo: 3,
  vip: 4,
  investor: 5,
};

/** Merge quota: −1 (unlimited) wins; otherwise sum */
export function stackLimit(current: number, add: number): number {
  if (current === -1 || add === -1) return -1;
  return current + add;
}

/** Days granted by a paid plan purchase (null = no expiry) */
export function getPurchaseDurationDays(
  planId: SubscriptionTier,
  billingCycle: BillingCycle
): number | null {
  if (planId === "investor") return null;
  if (planId === "vip") {
    const years = SUBSCRIPTION_PLANS.vip.durationYears ?? 5;
    return years * 365;
  }
  if (billingCycle === "lifetime") return null;
  if (billingCycle === "yearly") return 365;
  return 30; // monthly
}

export function pickHigherTier(
  a: SubscriptionTier,
  b: SubscriptionTier
): SubscriptionTier {
  return TIER_RANK[b] > TIER_RANK[a] ? b : a;
}

export function freeEntitlements(): Entitlements {
  const free = SUBSCRIPTION_PLANS.free.limits;
  return {
    tier: "free",
    farms: free.farms,
    evidence: free.evidencePerMonth,
    expiresAt: null,
    startedAt: null,
    isVip: false,
    totalDaysGranted: 0,
    signatures: [],
  };
}

/** Unlimited access granted out-of-band by the operator (env allowlist). */
export function partnerEntitlements(): Entitlements {
  return {
    tier: "investor",
    farms: -1,
    evidence: -1,
    expiresAt: null,
    startedAt: null,
    isVip: false,
    totalDaysGranted: 0,
    signatures: [],
  };
}

function receiptTime(r: VerifiedReceipt): number {
  if (r.blockTime != null) return r.blockTime * 1000;
  const parsed = Date.parse(r.createdAt);
  return Number.isNaN(parsed) ? 0 : parsed;
}

/**
 * Replay verified receipts in chronological order, stacking days and quotas.
 * Receipts that are pending or rejected grant nothing. Duplicate signatures
 * are counted once, so replaying the same payment cannot inflate a quota.
 */
export function replayReceipts(
  receipts: VerifiedReceipt[],
  now: Date = new Date()
): Entitlements {
  const seen = new Set<string>();
  const granted = receipts
    .filter((r) => {
      if (r.status !== "verified") return false;
      if (seen.has(r.signature)) return false;
      seen.add(r.signature);
      return true;
    })
    .sort((a, b) => receiptTime(a) - receiptTime(b));

  if (granted.length === 0) return freeEntitlements();

  const result: Entitlements = {
    tier: "free",
    farms: 0,
    evidence: 0,
    expiresAt: null,
    startedAt: new Date(receiptTime(granted[0])).toISOString(),
    isVip: false,
    totalDaysGranted: 0,
    signatures: [],
  };

  let noExpiry = false;

  for (const receipt of granted) {
    const plan = SUBSCRIPTION_PLANS[receipt.tier];
    if (!plan) continue;

    const isVipPurchase = receipt.tier === "vip";
    const days = getPurchaseDurationDays(receipt.tier, receipt.billingCycle);

    if (isVipPurchase) {
      result.farms = -1;
      result.evidence = -1;
      result.isVip = true;
    } else {
      result.farms = stackLimit(result.farms, plan.limits.farms);
      result.evidence = stackLimit(result.evidence, plan.limits.evidencePerMonth);
    }

    if (days === null) {
      noExpiry = true;
    } else {
      // Anchor to when the payment happened, not to "now" — otherwise replaying
      // an old expired purchase would silently revive it.
      const paidAt = new Date(receiptTime(receipt));
      const base =
        result.expiresAt && new Date(result.expiresAt) > paidAt
          ? new Date(result.expiresAt)
          : paidAt;
      result.expiresAt = new Date(base.getTime() + days * MS_PER_DAY).toISOString();
      result.totalDaysGranted += days;
    }

    result.tier = pickHigherTier(result.tier, receipt.tier);
    result.signatures.push(receipt.signature);
  }

  if (noExpiry) result.expiresAt = null;

  // Expired and not lifetime → fall back to free quotas, keep the audit trail
  if (result.expiresAt && new Date(result.expiresAt) < now) {
    const free = freeEntitlements();
    return { ...free, signatures: result.signatures, startedAt: result.startedAt };
  }

  if (result.isVip) result.tier = "vip";
  return result;
}

export function daysRemaining(
  entitlements: Entitlements,
  now: Date = new Date()
): number | null {
  if (!entitlements.expiresAt) return null;
  const diff = new Date(entitlements.expiresAt).getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / MS_PER_DAY));
}
