/**
 * English overrides for subscription plan copy (VI lives in constants.ts).
 * `features` is matched to `SUBSCRIPTION_PLANS[id].features` by index, so the
 * order here must stay identical to constants.ts — the `roadmap` / `included`
 * flags come from there.
 */
export const PLAN_EN: Record<
  string,
  {
    tagline: string;
    badge?: string;
    pricingOptions?: string[];
    features: string[];
  }
> = {
  free: {
    tagline: "Get started with OpenAgriX — no credit card required",
    features: [
      "1 farm",
      "3 evidence records (stacked)",
      "1 member",
      "Public Evidence Explorer",
      "Shareable QR code",
      "Solana Devnet",
      "IoT sensors",
      "Carbon credit pipeline",
      "API access",
      "Priority support",
    ],
  },
  monthly: {
    tagline: "Flexible — pay monthly, cancel anytime",
    features: [
      "3 farms",
      "200 evidence records (stacked)",
      "2 IoT sensors",
      "3 team members",
      "API access (500 calls/day)",
      "5GB storage",
      "Carbon tracking dashboard",
      "Email support",
      "CITES documentation",
      "Dedicated account manager",
    ],
  },
  yearly: {
    tagline: "Save 25% compared to the monthly plan — 12-month commitment",
    badge: "Save 25%",
    features: [
      "10 farms",
      "1,000 evidence records (stacked)",
      "10 IoT sensors",
      "10 team members",
      "API access (2,000 calls/day)",
      "20GB storage",
      "Carbon credit pipeline",
      "Priority email support",
      "Basic CITES documentation",
      "Dedicated account manager",
    ],
  },
  combo: {
    tagline:
      "For buyers and export businesses — flexible fees by policy and scale",
    badge: "Flexible",
    pricingOptions: [
      "Pay per use (verify / shipment)",
      "Pay monthly or yearly",
      "Pay lifetime (one-time)",
      "Quote by contract / volume",
    ],
    features: [
      "Unlimited origin & on-chain dossier verification",
      "Export supply-chain traceability (CITES / certificates)",
      "Multiple payment modes: per-use · yearly · lifetime",
      "Fees balanced by policy & order volume",
      "API + dashboard for buyers / exporters",
      "Share QR / verify links with overseas partners",
      "Export dossier & compliance support",
      "Dedicated account manager by contract",
      "White-label / custom branding",
      "Enterprise 24/7 SLA",
    ],
  },
  vip: {
    tagline: "One-time payment of $2,500 — enterprise benefits for 5 years",
    badge: "5 years",
    features: [
      "One-time payment of $2,500 — 5 years of use",
      "Unlimited farms",
      "Unlimited evidence records",
      "Unlimited team members",
      "Unlimited IoT sensors",
      "Unlimited API access",
      "Unlimited storage",
      "Carbon credit origination + trading",
      "Full CITES + export documentation",
      "Custom branding / white-label + SLA 99.9%",
    ],
  },
  investor: {
    tagline:
      "For strategic partners — talk to the team directly, nothing is sold through this website",
    badge: "By agreement",
    features: [
      "Full product access, same as VIP",
      "Direct roadmap conversations with the founder",
      "Early access to new features",
      "Regular progress updates",
      "Co-branding under a separate agreement",
      "Priority strategic partnership discussions",
      "Equity / investment terms — not sold through this website",
      "On-chain governance",
      "Carbon revenue sharing",
      "Advisory Board seat",
    ],
  },
};
