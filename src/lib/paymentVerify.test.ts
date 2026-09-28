import { describe, expect, it } from "vitest";
import {
  judgeReceipt,
  type OnChainPaymentFacts,
  type PaymentReceipt,
} from "./paymentVerify";

const WALLET = "6EfeCgJVozpKjTNdstrNTedePHJz3si5nQjSvmcXH2eT";
const OTHER_WALLET = "EJjtoXBaVPrmXPE3Aqjt6QL2v4i1HMFXQUHcDshBBzoz";
const SOL_PRICE = 200;

function usdcReceipt(overrides: Partial<PaymentReceipt> = {}): PaymentReceipt {
  return {
    signature: "sig-usdc",
    tier: "monthly",
    billingCycle: "monthly",
    asset: "USDC",
    usdAmount: 24,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function solReceipt(overrides: Partial<PaymentReceipt> = {}): PaymentReceipt {
  return {
    signature: "sig-sol",
    tier: "monthly",
    billingCycle: "monthly",
    asset: "SOL",
    usdAmount: 24,
    // 24 USD at 200 USD/SOL = 0.12 SOL
    lamports: 0.12 * 1e9,
    solUsdPrice: SOL_PRICE,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function facts(overrides: Partial<OnChainPaymentFacts> = {}): OnChainPaymentFacts {
  return {
    succeeded: true,
    feePayer: WALLET,
    lamportsToTreasury: 0,
    usdcToTreasury: 0,
    blockTime: 1_780_000_000,
    ...overrides,
  };
}

describe("judgeReceipt — safety rails", () => {
  it("stays pending when the transaction cannot be read yet", () => {
    const r = judgeReceipt(usdcReceipt(), WALLET, null, null);
    expect(r.status).toBe("pending");
  });

  it("rejects a failed transaction", () => {
    const r = judgeReceipt(
      usdcReceipt(),
      WALLET,
      facts({ succeeded: false, usdcToTreasury: 24 }),
      null
    );
    expect(r.status).toBe("rejected");
    expect(r.reason).toBe("txFailed");
  });

  it("rejects a payment someone else made", () => {
    const r = judgeReceipt(
      usdcReceipt(),
      WALLET,
      facts({ feePayer: OTHER_WALLET, usdcToTreasury: 24 }),
      null
    );
    expect(r.status).toBe("rejected");
    expect(r.reason).toBe("payerMismatch");
  });

  it("rejects a receipt whose claimed price is not the plan price", () => {
    const r = judgeReceipt(
      // Real $24 transfer, but the cache claims it bought VIP
      usdcReceipt({ tier: "vip", billingCycle: "lifetime", usdAmount: 24 }),
      WALLET,
      facts({ usdcToTreasury: 24 }),
      null
    );
    expect(r.status).toBe("rejected");
    expect(r.reason).toBe("priceMismatch");
  });

  it("rejects a contact-only tier that has no payable price", () => {
    const r = judgeReceipt(
      usdcReceipt({ tier: "investor", billingCycle: "lifetime", usdAmount: 10000 }),
      WALLET,
      facts({ usdcToTreasury: 10000 }),
      null
    );
    expect(r.status).toBe("rejected");
    expect(r.reason).toBe("priceMismatch");
  });
});

describe("judgeReceipt — USDC", () => {
  it("verifies an exact payment", () => {
    const r = judgeReceipt(usdcReceipt(), WALLET, facts({ usdcToTreasury: 24 }), null);
    expect(r.status).toBe("verified");
  });

  it("rejects an underpayment", () => {
    const r = judgeReceipt(usdcReceipt(), WALLET, facts({ usdcToTreasury: 1 }), null);
    expect(r.status).toBe("rejected");
    expect(r.reason).toBe("amountTooLow");
  });

  it("rejects when the treasury received nothing", () => {
    const r = judgeReceipt(usdcReceipt(), WALLET, facts(), null);
    expect(r.status).toBe("rejected");
    expect(r.reason).toBe("noTransfer");
  });

  it("accepts a small overpayment", () => {
    const r = judgeReceipt(usdcReceipt(), WALLET, facts({ usdcToTreasury: 24.5 }), null);
    expect(r.status).toBe("verified");
  });
});

describe("judgeReceipt — SOL", () => {
  it("verifies a quoted transfer", () => {
    const r = judgeReceipt(
      solReceipt(),
      WALLET,
      facts({ lamportsToTreasury: 0.12 * 1e9 }),
      SOL_PRICE
    );
    expect(r.status).toBe("verified");
  });

  it("rejects when fewer lamports than quoted reached the treasury", () => {
    const r = judgeReceipt(
      solReceipt(),
      WALLET,
      facts({ lamportsToTreasury: 0.01 * 1e9 }),
      SOL_PRICE
    );
    expect(r.status).toBe("rejected");
    expect(r.reason).toBe("amountTooLow");
  });

  it("rejects a forged quote claiming an absurd SOL price to pay dust", () => {
    const forged = solReceipt({ lamports: 1000, solUsdPrice: 24_000_000 });
    const r = judgeReceipt(
      forged,
      WALLET,
      facts({ lamportsToTreasury: 1000 }),
      SOL_PRICE
    );
    expect(r.status).toBe("rejected");
    expect(r.reason).toBe("priceImplausible");
  });

  it("rejects a quote that does not cover the plan price", () => {
    const r = judgeReceipt(
      solReceipt({ lamports: 0.001 * 1e9 }),
      WALLET,
      facts({ lamportsToTreasury: 0.001 * 1e9 }),
      SOL_PRICE
    );
    expect(r.status).toBe("rejected");
    expect(r.reason).toBe("priceImplausible");
  });

  it("tolerates real price drift when the feed is unavailable", () => {
    const r = judgeReceipt(
      solReceipt(),
      WALLET,
      facts({ lamportsToTreasury: 0.12 * 1e9 }),
      null
    );
    expect(r.status).toBe("verified");
  });
});
