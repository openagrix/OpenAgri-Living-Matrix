import { PublicKey } from "@solana/web3.js";

// ─── Program ID ──────────────────────────────────────────────────────────────
export const PROGRAM_ID = new PublicKey(
  "2pcucTtxUGkNidFi48ioK8oLaUSCcMH3QEabA8QasGsL"
);

export const SOLANA_NETWORK = "devnet";
export const SOLANA_RPC = "https://api.devnet.solana.com";

export const EXPLORER_BASE = "https://explorer.solana.com";
export const EXPLORER_CLUSTER = "?cluster=devnet";

/** Ví nhận thanh toán gói (Devnet) */
export const TREASURY_WALLET = new PublicKey(
  "D6YX9TW55bCK7ZTH5pPvvaD1EuWZPRHs4fhxQAQEW7vC"
);

/** Circle USDC mint trên Solana Devnet (6 decimals) */
export const USDC_MINT_DEVNET = new PublicKey(
  "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"
);
export const USDC_DECIMALS = 6;

/**
 * Chainlink SOL/USD Transmissions account — Solana Devnet
 * @see https://docs.chain.link/data-feeds/solana/using-data-feeds-off-chain
 */
export const CHAINLINK_SOL_USD_FEED = new PublicKey(
  "99B2bTijsU6f1GCT73HmdR7HCFFjGMBcPZY6jZ96ynrR"
);
/** Store program that owns feed accounts on Devnet/Mainnet */
export const CHAINLINK_STORE_PROGRAM = new PublicKey(
  "HEvSKofvBgfaexv23kMabbYqxasxU3mQ4ibBMEmJWHny"
);

export function explorerTxUrl(sig: string): string {
  return `${EXPLORER_BASE}/tx/${sig}${EXPLORER_CLUSTER}`;
}
export function explorerAccountUrl(address: string): string {
  return `${EXPLORER_BASE}/address/${address}${EXPLORER_CLUSTER}`;
}

/**
 * Official CRE docs receiver on Solana Devnet — Phase 1 write target.
 * Our own `openagri_attestation` program source lives in programs/ but
 * cannot be built yet on this machine's Solana BPF toolchain (Rust 1.84).
 */
export const CRE_DOCS_RECEIVER_PROGRAM_ID = new PublicKey(
  "7k8NypziCPqVY8GYyCw7aqaR5aamFAMdH5ZaHVrZCS94"
);
export const OPENAGRI_ATTESTATION_PROGRAM_ID = new PublicKey(
  "8yt5CJpGNwPHPHs2ooVyk2giYyyapMLzpCNoxQ2kvZrv"
);
export const ONG_DU_LOCKED_HASH =
  "6982dbbdb4703000db9374149a2a00e860db0ac32fbb0509165c5ec95077c3f4";
/** Devnet tx from Phase 1 CRE `--broadcast` (2026-09-06). */
export const ONG_DU_ATTESTATION_TX =
  "2qKbucunnomSLVcybUfKCqsYBku5VinsdpWxwPu83jsSr7MF2yA6FXGzyEPa12ijH3aNJ8ig8q8rMABERck5PuZp";

// ─── Role System ─────────────────────────────────────────────────────────────
// Thêm ví của bạn vào đây để có quyền Administrator
// Lấy từ: solana-keygen pubkey ~/.config/solana/id.json
export const ADMIN_WALLETS: string[] = [
  "EJjtoXBaVPrmXPE3Aqjt6QL2v4i1HMFXQUHcDshBBzoz", // deployer wallet
  "6EfeCgJVozpKjTNdstrNTedePHJz3si5nQjSvmcXH2eT", // dev wallet
];

/** Investor wallets from .env (comma-separated). Requires NEXT_PUBLIC_ prefix for client. */
function parseWalletList(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export const INVESTOR_WALLETS: string[] = parseWalletList(
  process.env.NEXT_PUBLIC_INVESTOR_WALLET_ADDRESS ??
    process.env.NEXT_PUBLIC_INVESTER_WALLET_ADDRESS
);

export function isInvestorWallet(publicKey: string | null | undefined): boolean {
  if (!publicKey) return false;
  return INVESTOR_WALLETS.includes(publicKey);
}

export type AppRole = "admin" | "member" | "guest";

export function getRole(publicKey: string | null | undefined): AppRole {
  if (!publicKey) return "guest";
  if (ADMIN_WALLETS.includes(publicKey)) return "admin";
  return "member";
}

export const LIVING_LABS = [
  {
    id: "kim-long",
    name: "Kim Long Living Lab",
    location: "Xã Kim Long, Châu Thành, Tiền Giang",
    cooperative: "HTX Đức Vinh",
    crops: ["banana", "cocoa", "bee", "compost"],
    icon: "🏡",
    region: "Đồng bằng sông Cửu Long",
    description: "Nông nghiệp tái sinh — chuối, ca cao, ong dú, compost hữu cơ",
  },
  {
    id: "nam-ban",
    name: "Nam Ban Green Hub",
    location: "Thị trấn Nam Ban, Lâm Hà, Lâm Đồng",
    cooperative: "Hợp tác xã Nam Ban",
    crops: ["coffee", "durian", "macadamia", "vegetable", "flower"],
    icon: "🏔️",
    region: "Tây Nguyên",
    description: "Nông nghiệp công nghệ cao — cà phê, sầu riêng, mắc ca",
  },
  {
    id: "do-bau",
    name: "Dó Bầu Bình Phước",
    location: "Bình Phước, Vietnam",
    cooperative: "HTX Dó bầu",
    crops: ["agarwood", "kyanam", "agarwood-oil", "cites", "plantation-carbon"],
    icon: "🌿",
    region: "Đông Nam Bộ",
    description: "Trầm hương CITES — truy xuất nguồn gốc từ giống đến xuất khẩu",
  },
];

export const CROP_OPTIONS = [
  { value: "banana" },
  { value: "cocoa" },
  { value: "bee" },
  { value: "compost" },
  { value: "coffee" },
  { value: "durian" },
  { value: "macadamia" },
  { value: "vegetable" },
  { value: "flower" },
  { value: "agarwood" },
  { value: "kyanam" },
  { value: "agarwood-oil" },
  { value: "cites" },
  { value: "plantation-carbon" },
  { value: "rice" },
  { value: "pepper" },
  { value: "mango" },
  { value: "jackfruit" },
] as const;

// ─── Subscription Plans ──────────────────────────────────────────────────────

export type SubscriptionTier =
  | "free"
  | "monthly"
  | "yearly"
  | "combo"
  | "vip"
  | "investor";

export type BillingCycle = "monthly" | "yearly" | "lifetime";

export interface PlanFeature {
  text: string;
  included: boolean;
  highlight?: boolean;
  /**
   * Feature is committed on the roadmap but NOT shipped yet.
   * Must be rendered with a visible "roadmap" marker so a plan is never
   * sold as if the capability already exists.
   */
  roadmap?: boolean;
}

export interface SubscriptionPlan {
  id: SubscriptionTier;
  name: string;
  nameVi: string;
  tagline: string;
  icon: string;
  color: {
    bg: string;
    border: string;
    badge: string;
    button: string;
    text: string;
    accent: string;
  };
  priceMonthly: number;   // USD/month
  priceYearly: number;    // USD/year (discounted)
  priceLifetime?: number; // USD one-time (VIP/Investor)
  currency: "USD" | "USDC";
  badge?: string;         // e.g. "Phổ biến nhất", "Tiết kiệm 30%"
  /** Flexible / policy-based pricing — hide fixed monthly rate on pricing page */
  flexiblePricing?: boolean;
  pricingOptions?: string[];
  /**
   * Plan cannot be bought in-app. Any commercial or investment terms are
   * settled in a signed agreement off-platform, so the pricing page must render
   * a contact CTA instead of a checkout button.
   */
  contactOnly?: boolean;
  contactEmail?: string;
  /** Disclosure rendered on the plan card (i18n key under `pricing.disclaimers`) */
  disclaimerKey?: string;
  /** One-time plans: access duration in years (e.g. VIP = 5) */
  durationYears?: number;
  limits: {
    farms: number;          // -1 = unlimited
    evidencePerMonth: number; // stacked quota (−1 = unlimited), not monthly reset
    iotSensors: number;
    teamMembers: number;
    apiCallsPerDay: number;
    storageGB: number;
  };
  features: PlanFeature[];
}

export const SUBSCRIPTION_PLANS: Record<SubscriptionTier, SubscriptionPlan> = {
  free: {
    id: "free",
    name: "Free",
    nameVi: "Miễn phí",
    tagline: "Bắt đầu với OpenAgriX — không cần thẻ tín dụng",
    icon: "🌱",
    color: {
      bg: "bg-gray-50",
      border: "border-gray-200",
      badge: "bg-gray-100 text-gray-700",
      button: "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50",
      text: "text-gray-700",
      accent: "text-gray-500",
    },
    priceMonthly: 0,
    priceYearly: 0,
    currency: "USD",
    limits: {
      farms: 1,
      evidencePerMonth: 3,
      iotSensors: 0,
      teamMembers: 1,
      apiCallsPerDay: 50,
      storageGB: 0.5,
    },
    features: [
      { text: "1 trang trại", included: true },
      { text: "3 evidence records (cộng dồn)", included: true },
      { text: "1 thành viên", included: true },
      { text: "Evidence Explorer công khai", included: true },
      { text: "QR code chia sẻ", included: true },
      { text: "Solana Devnet", included: true },
      { text: "IoT sensors", included: false },
      { text: "Carbon credit pipeline", included: false },
      { text: "API access", included: false },
      { text: "Priority support", included: false },
    ],
  },

  monthly: {
    id: "monthly",
    name: "Monthly",
    nameVi: "Gói Tháng",
    tagline: "Linh hoạt — thanh toán hàng tháng, hủy bất cứ lúc nào",
    icon: "📅",
    color: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      badge: "bg-blue-100 text-blue-700",
      button: "bg-blue-600 text-white hover:bg-blue-700",
      text: "text-blue-700",
      accent: "text-blue-500",
    },
    priceMonthly: 24,
    priceYearly: 288,
    currency: "USD",
    limits: {
      farms: 3,
      evidencePerMonth: 200,
      iotSensors: 2,
      teamMembers: 3,
      apiCallsPerDay: 500,
      storageGB: 5,
    },
    features: [
      { text: "3 trang trại", included: true },
      { text: "200 evidence records (cộng dồn)", included: true },
      { text: "2 IoT sensors", included: true, roadmap: true },
      { text: "3 thành viên nhóm", included: true },
      { text: "API access (500 calls/day)", included: true, roadmap: true },
      { text: "5GB storage", included: true, roadmap: true },
      { text: "Carbon tracking dashboard", included: true },
      { text: "Email support", included: true },
      { text: "CITES documentation", included: false },
      { text: "Dedicated account manager", included: false },
    ],
  },

  yearly: {
    id: "yearly",
    name: "Yearly",
    nameVi: "Gói Năm",
    tagline: "Tiết kiệm 25% so với gói tháng — cam kết 12 tháng",
    icon: "📆",
    badge: "Tiết kiệm 25%",
    color: {
      bg: "bg-agri-50",
      border: "border-agri-300",
      badge: "bg-agri-100 text-agri-700",
      button: "bg-agri-600 text-white hover:bg-agri-700",
      text: "text-agri-700",
      accent: "text-agri-500",
    },
    priceMonthly: 18,
    priceYearly: 162,
    currency: "USD",
    limits: {
      farms: 10,
      evidencePerMonth: 1000,
      iotSensors: 10,
      teamMembers: 10,
      apiCallsPerDay: 2000,
      storageGB: 20,
    },
    features: [
      { text: "10 trang trại", included: true },
      { text: "1,000 evidence records (cộng dồn)", included: true },
      { text: "10 IoT sensors", included: true, roadmap: true },
      { text: "10 thành viên nhóm", included: true },
      { text: "API access (2,000 calls/day)", included: true, roadmap: true },
      { text: "20GB storage", included: true, roadmap: true },
      { text: "Carbon credit pipeline", included: true, roadmap: true },
      { text: "Priority email support", included: true },
      { text: "CITES documentation basic", included: true, roadmap: true },
      { text: "Dedicated account manager", included: false },
    ],
  },

  combo: {
    id: "combo",
    name: "Buyer & Export",
    nameVi: "Gói Buyer & Xuất khẩu",
    tagline:
      "Dành cho buyer và doanh nghiệp xuất khẩu — mức phí linh hoạt theo chính sách và quy mô",
    icon: "🌐",
    badge: "Linh hoạt",
    flexiblePricing: true,
    pricingOptions: [
      "Trả theo lượt (verify / lô hàng)",
      "Trả theo tháng hoặc theo năm",
      "Trả vĩnh viễn (một lần)",
      "Báo giá theo hợp đồng / volume",
    ],
    color: {
      bg: "bg-purple-50",
      border: "border-purple-300",
      badge: "bg-purple-100 text-purple-700",
      button: "bg-purple-600 text-white hover:bg-purple-700",
      text: "text-purple-700",
      accent: "text-purple-500",
    },
    // Reference rates — actual quote is flexible; UI shows "Linh hoạt"
    priceMonthly: 58,
    priceYearly: 580,
    priceLifetime: 2900,
    currency: "USD",
    limits: {
      farms: 50,
      evidencePerMonth: -1,
      iotSensors: 50,
      teamMembers: 30,
      apiCallsPerDay: 10000,
      storageGB: 100,
    },
    features: [
      { text: "Verify nguồn gốc & hồ sơ on-chain không giới hạn", included: true, highlight: true },
      { text: "Truy xuất chuỗi cung ứng xuất khẩu (CITES / chứng nhận)", included: true, highlight: true },
      { text: "Nhiều hình thức thanh toán: theo lượt · năm · vĩnh viễn", included: true, highlight: true },
      { text: "Mức phí cân đối theo chính sách & quy mô đơn hàng", included: true, highlight: true },
      { text: "API + dashboard cho buyer / nhà xuất khẩu", included: true, roadmap: true },
      { text: "Chia sẻ QR / link verify cho đối tác nước ngoài", included: true },
      { text: "Hỗ trợ hồ sơ xuất khẩu & tài liệu tuân thủ", included: true },
      { text: "Account manager riêng theo hợp đồng", included: true },
      { text: "White-label / branding riêng", included: false },
      { text: "SLA enterprise 24/7", included: false },
    ],
  },

  vip: {
    id: "vip",
    name: "VIP",
    nameVi: "Gói VIP",
    tagline: "Thanh toán một lần $2,500 — quyền lợi enterprise trong 5 năm",
    icon: "👑",
    badge: "5 năm",
    color: {
      bg: "bg-amber-50",
      border: "border-amber-300",
      badge: "bg-amber-100 text-amber-800",
      button: "bg-amber-600 text-white hover:bg-amber-700",
      text: "text-amber-800",
      accent: "text-amber-600",
    },
    priceMonthly: 0,
    priceYearly: 0,
    priceLifetime: 2500,
    /** One-time purchase covers this many years */
    durationYears: 5,
    currency: "USD",
    limits: {
      farms: -1,
      evidencePerMonth: -1,
      iotSensors: -1,
      teamMembers: -1,
      apiCallsPerDay: -1,
      storageGB: -1,
    },
    features: [
      { text: "Thanh toán 1 lần $2,500 — dùng 5 năm", included: true, highlight: true },
      { text: "Unlimited farms", included: true, highlight: true },
      { text: "Unlimited evidence records", included: true, highlight: true },
      { text: "Unlimited team members", included: true },
      { text: "Unlimited IoT sensors", included: true, roadmap: true },
      { text: "Unlimited API access", included: true, roadmap: true },
      { text: "Unlimited storage", included: true, roadmap: true },
      { text: "Carbon credit origination + trading", included: true, roadmap: true },
      { text: "Full CITES + export documentation", included: true, roadmap: true },
      { text: "Custom branding / white-label + SLA 99.9%", included: true, roadmap: true },
    ],
  },

  investor: {
    id: "investor",
    name: "Partner",
    nameVi: "Gói Đối Tác Chiến Lược",
    tagline:
      "Dành cho đối tác chiến lược — trao đổi trực tiếp với đội ngũ, không thanh toán qua website",
    icon: "💎",
    badge: "Theo thỏa thuận",
    /**
     * Deliberately NOT purchasable in-app: no price, no checkout.
     * Any equity/investment discussion happens under a signed agreement
     * reviewed by counsel, never through an on-chain subscription payment.
     */
    contactOnly: true,
    contactEmail: "hello@openagrix.com",
    disclaimerKey: "investorNotSecurity",
    priceMonthly: 0,
    priceYearly: 0,
    currency: "USDC",
    color: {
      bg: "bg-gradient-to-br from-slate-900 to-slate-800",
      border: "border-slate-600",
      badge: "bg-slate-700 text-white",
      button: "bg-white text-slate-900 hover:bg-slate-100",
      text: "text-white",
      accent: "text-slate-300",
    },
    limits: {
      farms: -1,
      evidencePerMonth: -1,
      iotSensors: -1,
      teamMembers: -1,
      apiCallsPerDay: -1,
      storageGB: -1,
    },
    features: [
      { text: "Toàn quyền truy cập sản phẩm như gói VIP", included: true, highlight: true },
      { text: "Trao đổi trực tiếp với founder về lộ trình", included: true, highlight: true },
      { text: "Early access tính năng mới", included: true },
      { text: "Bản cập nhật tiến độ định kỳ", included: true },
      { text: "Co-branding theo thỏa thuận riêng", included: true },
      { text: "Ưu tiên thảo luận hợp tác chiến lược", included: true },
      { text: "Cổ phần / điều khoản đầu tư — không bán qua website", included: false },
      { text: "Governance on-chain", included: false, roadmap: true },
      { text: "Chia sẻ doanh thu carbon", included: false, roadmap: true },
      { text: "Ghế Advisory Board", included: false, roadmap: true },
    ],
  },
};

// Helper: get plan display price
export function getPlanPrice(
  plan: SubscriptionPlan,
  cycle: "monthly" | "yearly",
  locale: "vi" | "en" = "vi"
): string {
  const free = locale === "en" ? "Free" : "Miễn phí";
  const flexible = locale === "en" ? "Flexible" : "Linh hoạt";
  const perMonth = locale === "en" ? "/mo" : "/tháng";
  if (plan.contactOnly) return locale === "en" ? "By agreement" : "Theo thỏa thuận";
  if (plan.flexiblePricing) return flexible;
  if (plan.priceLifetime !== undefined && (plan.id === "investor" || plan.id === "vip")) {
    return `$${plan.priceLifetime.toLocaleString()} ${plan.currency}`;
  }
  if (plan.priceMonthly === 0) return free;
  if (cycle === "monthly") return `$${plan.priceMonthly}${perMonth}`;
  return `$${(plan.priceYearly / 12).toFixed(0)}${perMonth}`;
}

export function getPlanSavings(
  plan: SubscriptionPlan,
  locale: "vi" | "en" = "vi"
): string | null {
  if (plan.flexiblePricing || plan.contactOnly) return null;
  if (
    plan.priceMonthly === 0 ||
    (plan.priceLifetime !== undefined && (plan.id === "investor" || plan.id === "vip"))
  ) {
    return null;
  }
  const annualIfMonthly = plan.priceMonthly * 12;
  const saved = annualIfMonthly - plan.priceYearly;
  if (saved <= 0) return null;
  const pct = Math.round((saved / annualIfMonthly) * 100);
  return locale === "en"
    ? `Save $${saved}/year (${pct}%)`
    : `Tiết kiệm $${saved}/năm (${pct}%)`;
}

/** Plans that can be checked out in-app. `contactOnly` plans never can. */
export function isPurchasable(plan: SubscriptionPlan): boolean {
  if (plan.contactOnly) return false;
  return plan.id !== "free";
}

/** Số USD phải thanh toán theo gói + chu kỳ (dùng cho USDC / quy đổi SOL) */
export function getPlanUsdAmount(
  plan: SubscriptionPlan,
  cycle: BillingCycle
): number {
  // Fail-safe: a contact-only plan must never produce a payable amount
  if (plan.contactOnly) return 0;
  if (plan.priceMonthly === 0 && !plan.priceLifetime && !plan.flexiblePricing) return 0;
  if (cycle === "lifetime" || plan.id === "investor" || plan.id === "vip") {
    return plan.priceLifetime ?? 0;
  }
  if (cycle === "yearly") return plan.priceYearly;
  return plan.priceMonthly;
}
