import { describe, expect, it } from "vitest";
import {
  MS_PER_DAY,
  daysRemaining,
  getPurchaseDurationDays,
  replayReceipts,
  stackLimit,
} from "./entitlements";
import { SUBSCRIPTION_PLANS } from "./constants";
import type { VerifiedReceipt } from "./paymentVerify";

const NOW = new Date("2026-06-01T00:00:00.000Z");

function receipt(overrides: Partial<VerifiedReceipt> = {}): VerifiedReceipt {
  return {
    signature: "sig-1",
    tier: "monthly",
    billingCycle: "monthly",
    asset: "USDC",
    usdAmount: 24,
    createdAt: NOW.toISOString(),
    status: "verified",
    blockTime: Math.floor(NOW.getTime() / 1000),
    ...overrides,
  };
}

describe("stackLimit", () => {
  it("sums finite quotas", () => {
    expect(stackLimit(3, 10)).toBe(13);
  });

  it("lets unlimited win from either side", () => {
    expect(stackLimit(-1, 10)).toBe(-1);
    expect(stackLimit(10, -1)).toBe(-1);
  });
});

describe("getPurchaseDurationDays", () => {
  it("grants 30 days monthly and 365 yearly", () => {
    expect(getPurchaseDurationDays("monthly", "monthly")).toBe(30);
    expect(getPurchaseDurationDays("yearly", "yearly")).toBe(365);
  });

  it("grants VIP the configured 5 years", () => {
    const years = SUBSCRIPTION_PLANS.vip.durationYears ?? 5;
    expect(getPurchaseDurationDays("vip", "lifetime")).toBe(years * 365);
  });

  it("treats a lifetime cycle as no expiry", () => {
    expect(getPurchaseDurationDays("combo", "lifetime")).toBeNull();
  });
});

describe("replayReceipts", () => {
  it("falls back to free quotas with no receipts", () => {
    const e = replayReceipts([], NOW);
    expect(e.tier).toBe("free");
    expect(e.farms).toBe(SUBSCRIPTION_PLANS.free.limits.farms);
    expect(e.evidence).toBe(SUBSCRIPTION_PLANS.free.limits.evidencePerMonth);
  });

  it("grants nothing for a rejected receipt", () => {
    const e = replayReceipts([receipt({ status: "rejected", reason: "payerMismatch" })], NOW);
    expect(e.tier).toBe("free");
    expect(e.signatures).toEqual([]);
  });

  it("grants nothing for a pending receipt", () => {
    const e = replayReceipts([receipt({ status: "pending" })], NOW);
    expect(e.tier).toBe("free");
  });

  it("applies plan quotas for a verified monthly purchase", () => {
    const e = replayReceipts([receipt()], NOW);
    expect(e.tier).toBe("monthly");
    expect(e.farms).toBe(SUBSCRIPTION_PLANS.monthly.limits.farms);
    expect(e.evidence).toBe(SUBSCRIPTION_PLANS.monthly.limits.evidencePerMonth);
    expect(daysRemaining(e, NOW)).toBe(30);
  });

  it("stacks quotas and days across purchases", () => {
    const e = replayReceipts(
      [receipt({ signature: "a" }), receipt({ signature: "b" })],
      NOW
    );
    expect(e.farms).toBe(SUBSCRIPTION_PLANS.monthly.limits.farms * 2);
    expect(e.evidence).toBe(SUBSCRIPTION_PLANS.monthly.limits.evidencePerMonth * 2);
    expect(e.totalDaysGranted).toBe(60);
    expect(daysRemaining(e, NOW)).toBe(60);
  });

  it("counts a replayed signature only once", () => {
    const e = replayReceipts([receipt({ signature: "dup" }), receipt({ signature: "dup" })], NOW);
    expect(e.farms).toBe(SUBSCRIPTION_PLANS.monthly.limits.farms);
    expect(e.totalDaysGranted).toBe(30);
  });

  it("keeps the highest tier when plans are mixed", () => {
    const e = replayReceipts(
      [
        receipt({ signature: "a", tier: "monthly", billingCycle: "monthly" }),
        receipt({ signature: "b", tier: "yearly", billingCycle: "yearly", usdAmount: 162 }),
      ],
      NOW
    );
    expect(e.tier).toBe("yearly");
  });

  it("gives VIP unlimited quotas and the badge", () => {
    const e = replayReceipts(
      [receipt({ tier: "vip", billingCycle: "lifetime", usdAmount: 2500 })],
      NOW
    );
    expect(e.isVip).toBe(true);
    expect(e.tier).toBe("vip");
    expect(e.farms).toBe(-1);
    expect(e.evidence).toBe(-1);
  });

  it("treats a lifetime combo purchase as never expiring", () => {
    const e = replayReceipts(
      [receipt({ tier: "combo", billingCycle: "lifetime", usdAmount: 2900 })],
      NOW
    );
    expect(e.expiresAt).toBeNull();
    expect(daysRemaining(e, NOW)).toBeNull();
  });

  it("expires an old purchase instead of reviving it from the current date", () => {
    const longAgo = new Date(NOW.getTime() - 400 * MS_PER_DAY);
    const e = replayReceipts(
      [
        receipt({
          createdAt: longAgo.toISOString(),
          blockTime: Math.floor(longAgo.getTime() / 1000),
        }),
      ],
      NOW
    );
    expect(e.tier).toBe("free");
    expect(e.farms).toBe(SUBSCRIPTION_PLANS.free.limits.farms);
  });
});
