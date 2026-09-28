"use client";

import { Suspense, useState, useCallback, useEffect } from "react";
import { CheckCircle, XCircle, Zap, Shield, Clock, Mail } from "lucide-react";
import { useRole } from "@/hooks/useRole";
import { useSubscription } from "@/hooks/useSubscription";
import {
  SUBSCRIPTION_PLANS,
  getPlanSavings,
  explorerTxUrl,
  isPurchasable,
  SOLANA_NETWORK,
  type SubscriptionTier,
  type BillingCycle,
} from "@/lib/constants";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { cn } from "@/lib/utils";
import { PaymentModal } from "@/components/PaymentModal";
import { toPurchaseEvidence, type PaymentResult } from "@/hooks/usePayment";
import { BuyerExportFormModal } from "@/components/BuyerExportFormModal";
import { useTranslation } from "@/i18n/LanguageProvider";
import { PLAN_EN } from "@/i18n/plans.en";

const PLAN_ORDER: SubscriptionTier[] = ["free", "monthly", "yearly", "combo", "vip", "investor"];

const PLAN_BUTTON: Record<SubscriptionTier, string> = {
  free: "btn-ghost w-full justify-center !rounded-full",
  monthly: "btn-primary w-full justify-center",
  yearly: "btn-primary w-full justify-center",
  combo: "w-full justify-center rounded-full bg-purple-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-purple-400",
  vip: "w-full justify-center rounded-full bg-amber-500 px-6 py-2.5 text-sm font-semibold text-forest-950 hover:bg-amber-400",
  investor: "w-full justify-center rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-forest-950 hover:bg-white/90",
};

const PLAN_BADGE: Record<SubscriptionTier, string> = {
  free: "rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-xs font-semibold text-white/70",
  monthly: "rounded-full border border-agri-500/20 bg-agri-500/10 px-2.5 py-1 text-xs font-semibold text-agri-300",
  yearly: "rounded-full border border-agri-500/20 bg-agri-500/10 px-2.5 py-1 text-xs font-semibold text-agri-300",
  combo: "rounded-full border border-purple-500/30 bg-purple-500/15 px-2.5 py-1 text-xs font-semibold text-purple-300",
  vip: "rounded-full border border-amber-500/30 bg-amber-500/15 px-2.5 py-1 text-xs font-semibold text-amber-300",
  investor: "rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-xs font-semibold text-white",
};

function PricingContent() {
  const { t, locale } = useTranslation();
  const [highlightParam, setHighlightParam] = useState<SubscriptionTier | null>(null);
  useEffect(() => {
    const hash = window.location.hash.replace("#", "") as SubscriptionTier;
    if (hash && PLAN_ORDER.includes(hash)) setHighlightParam(hash);
    const params = new URLSearchParams(window.location.search);
    const q = params.get("highlight") as SubscriptionTier | null;
    if (q && PLAN_ORDER.includes(q)) setHighlightParam(q);
  }, []);

  const { walletAddress, isGuest } = useRole();
  const {
    tier: currentTier,
    subscribe,
    daysRemaining,
    effectiveLimits,
    isVip: userIsVip,
    isInvestor: userIsInvestor,
    verifying,
    rejectedReceipts,
    pendingReceipts,
  } = useSubscription(walletAddress);

  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly");
  const [payPlan, setPayPlan] = useState<SubscriptionTier | null>(null);
  const [buyerFormOpen, setBuyerFormOpen] = useState(false);
  const [lastTx, setLastTx] = useState<string | null>(null);
  const [upgraded, setUpgraded] = useState<SubscriptionTier | null>(null);

  const openPayment = useCallback((planId: SubscriptionTier) => {
    if (!walletAddress || planId === "free") return;
    // Contact-only plans (strategic partner) are never checked out in-app
    if (!isPurchasable(SUBSCRIPTION_PLANS[planId])) return;
    if (userIsInvestor) return;
    if (userIsVip && planId !== "investor") return;
    setLastTx(null);
    if (planId === "combo") {
      setBuyerFormOpen(true);
      return;
    }
    setPayPlan(planId);
  }, [walletAddress, userIsVip, userIsInvestor]);

  const handleBuyerFormContinue = useCallback(() => {
    setBuyerFormOpen(false);
    setPayPlan("combo");
  }, []);

  const handlePaymentSuccess = useCallback((result: PaymentResult) => {
    if (!payPlan) return;
    const cycle: BillingCycle =
      payPlan === "vip"
        ? "lifetime"
        : billingCycle === "yearly"
          ? "yearly"
          : "monthly";
    subscribe(payPlan, cycle, toPurchaseEvidence(result));
    setLastTx(result.signature);
    setUpgraded(payPlan);
    setPayPlan(null);
    setTimeout(() => setUpgraded(null), 5000);
  }, [payPlan, billingCycle, subscribe]);

  const payCycle: BillingCycle =
    payPlan === "vip"
      ? "lifetime"
      : billingCycle === "yearly"
        ? "yearly"
        : "monthly";

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      {buyerFormOpen && (
        <BuyerExportFormModal
          walletAddress={walletAddress}
          onClose={() => setBuyerFormOpen(false)}
          onContinueToPayment={handleBuyerFormContinue}
        />
      )}

      {payPlan && (
        <PaymentModal
          planId={payPlan}
          billingCycle={payCycle}
          onClose={() => setPayPlan(null)}
          onSuccess={handlePaymentSuccess}
        />
      )}

      <div className="mb-12 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-agri-500/20 bg-agri-500/10 px-4 py-1.5 text-sm text-agri-300">
          <Zap className="h-3.5 w-3.5 text-agri-400" />
          {t("pricing.badge")}
        </div>
        <h1 className="mb-3 text-4xl font-extrabold text-white">{t("pricing.title")}</h1>
        <p className="mx-auto max-w-xl text-white/50">{t("pricing.subtitle")}</p>
        <p className="mx-auto mt-3 max-w-xl text-sm text-agri-300/80">{t("pricing.stackNote")}</p>
        <div className="mx-auto mt-6 max-w-2xl space-y-2 rounded-3xl border border-white/10 bg-white/[0.03] px-5 py-4 text-left text-xs leading-relaxed text-white/50">
          <p className="flex items-start gap-2">
            <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400/80" />
            <span>{t("pricing.roadmapLegend")}</span>
          </p>
          <p>{t("pricing.networkNote", { network: SOLANA_NETWORK })}</p>
          <p>{t("pricing.entitlementNote")}</p>
        </div>
        {lastTx && (
          <p className="mt-3 text-sm text-agri-300">
            {t("pricing.paymentSuccess")}{" "}
            <a
              href={explorerTxUrl(lastTx)}
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2"
            >
              {t("pricing.viewTx")}
            </a>
          </p>
        )}
      </div>

      {walletAddress && (userIsVip || userIsInvestor || daysRemaining != null || currentTier !== "free") && (
        <div
          className={cn(
            "mb-10 rounded-3xl border px-6 py-5 text-center",
            userIsInvestor
              ? "border-white/20 bg-white/5"
              : userIsVip
                ? "border-amber-500/30 bg-amber-500/10"
                : "border-agri-500/25 bg-agri-500/10"
          )}
        >
          <p className="text-sm font-semibold text-white">{t("pricing.yourProfile")}</p>
          {userIsInvestor ? (
            <p className="mt-1 text-sm text-white/70">{t("pricing.investorLocked")}</p>
          ) : userIsVip ? (
            <p className="mt-1 text-sm text-amber-200/80">{t("pricing.vipLocked")}</p>
          ) : (
            <p className="mt-1 text-sm text-agri-200/80">
              {daysRemaining != null && t("subscription.stackedDays", { n: daysRemaining })}
              {" · "}
              {t("subscription.farms")}:{" "}
              {effectiveLimits.farms === -1 ? "∞" : effectiveLimits.farms}
              {" · "}
              {t("subscription.evidence")}:{" "}
              {effectiveLimits.evidencePerMonth === -1
                ? "∞"
                : effectiveLimits.evidencePerMonth}
            </p>
          )}
        </div>
      )}

      {walletAddress && verifying && (
        <p className="mb-6 text-center text-xs text-white/40">
          {t("pricing.verifyingReceipts")}
        </p>
      )}

      {rejectedReceipts.length > 0 && (
        <div className="mb-6 rounded-3xl border border-red-500/30 bg-red-500/10 px-6 py-4 text-center text-sm text-red-200">
          {t("pricing.receiptRejected", { n: rejectedReceipts.length })}
        </div>
      )}

      {pendingReceipts.length > 0 && (
        <div className="mb-6 rounded-3xl border border-amber-500/30 bg-amber-500/10 px-6 py-4 text-center text-sm text-amber-200">
          {t("pricing.receiptPending", { n: pendingReceipts.length })}
        </div>
      )}

      {!userIsInvestor && (
      <>
      <div className="mb-10 flex items-center justify-center gap-3">
        <span className={cn("text-sm font-medium", billingCycle === "monthly" ? "text-white" : "text-white/40")}>
          {t("pricing.monthly")}
        </span>
        <button
          onClick={() => setBillingCycle(billingCycle === "monthly" ? "yearly" : "monthly")}
          className={cn(
            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
            billingCycle === "yearly" ? "bg-agri-500" : "bg-white/20"
          )}
        >
          <span className={cn(
            "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
            billingCycle === "yearly" ? "translate-x-6" : "translate-x-1"
          )} />
        </button>
        <span className={cn("text-sm font-medium", billingCycle === "yearly" ? "text-white" : "text-white/40")}>
          {t("pricing.yearly")}
        </span>
        <span className="rounded-full border border-agri-500/20 bg-agri-500/10 px-2.5 py-1 text-xs font-semibold text-agri-300">
          {t("pricing.saveUpTo")}
        </span>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {PLAN_ORDER.map((planId) => {
          const plan = SUBSCRIPTION_PLANS[planId];
          const en = PLAN_EN[planId];
          const planName = locale === "en" ? plan.name : plan.nameVi;
          const tagline = locale === "en" && en ? en.tagline : plan.tagline;
          const badge = locale === "en" && en?.badge ? en.badge : plan.badge;
          const pricingOptions =
            locale === "en" && en?.pricingOptions ? en.pricingOptions : plan.pricingOptions;
          const features = plan.features.map((f, i) => ({
            ...f,
            text: locale === "en" && en?.features[i] ? en.features[i] : f.text,
          }));

          const isCurrentPlan = currentTier === planId;
          const isHighlighted = planId === highlightParam || planId === "combo";
          const isInvestor = planId === "investor";
          const isVip = planId === "vip";
          const savings = getPlanSavings(plan, locale);
          const purchaseBlocked =
            userIsInvestor || (userIsVip && planId !== "investor" && planId !== "free");

          return (
            <div
              key={planId}
              className={cn(
                "relative rounded-3xl border p-6 transition-all",
                isInvestor
                  ? "border-white/20 bg-gradient-to-br from-forest-800 to-forest-900"
                  : isVip
                  ? "border-amber-500/30 bg-amber-500/[0.06]"
                  : isCurrentPlan
                  ? "border-agri-500/40 bg-agri-500/10 ring-1 ring-agri-500/30"
                  : isHighlighted
                  ? "border-purple-500/40 bg-purple-500/[0.06] ring-1 ring-purple-500/25"
                  : "border-white/10 bg-white/[0.03] hover:border-agri-500/30"
              )}
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{plan.icon}</span>
                  <div>
                    <div className="text-base font-bold text-white">{planName}</div>
                    <div className="text-xs text-white/45">{plan.name}</div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {isCurrentPlan && (
                    <span className="rounded-full bg-agri-500 px-2.5 py-1 text-xs font-semibold text-forest-950">
                      {t("pricing.currentPlan")}
                    </span>
                  )}
                  {badge && !isCurrentPlan && (
                    <span className={PLAN_BADGE[planId]}>{badge}</span>
                  )}
                </div>
              </div>

              <div className="mb-1">
                {plan.contactOnly ? (
                  <>
                    <span className="text-3xl font-bold text-white">
                      {t("pricing.byAgreement")}
                    </span>
                    <span className="ml-1 text-sm text-white/45">
                      {t("pricing.noOnlineSale")}
                    </span>
                  </>
                ) : plan.flexiblePricing ? (
                  <>
                    <span className="text-3xl font-bold text-white">{t("pricing.flexible")}</span>
                    <span className="ml-1 text-sm text-white/45">{t("pricing.byPolicy")}</span>
                  </>
                ) : (
                  <>
                    <span className="text-3xl font-bold text-white">
                      {plan.priceLifetime !== undefined &&
                      (planId === "investor" || planId === "vip")
                        ? `$${plan.priceLifetime.toLocaleString()}`
                        : plan.priceMonthly === 0
                        ? t("common.free")
                        : billingCycle === "yearly"
                        ? `$${(plan.priceYearly / 12).toFixed(0)}`
                        : `$${plan.priceMonthly}`}
                    </span>
                    {plan.priceMonthly > 0 &&
                      !(
                        plan.priceLifetime !== undefined &&
                        (planId === "investor" || planId === "vip")
                      ) && (
                      <span className="ml-1 text-sm text-white/45">
                        {t("common.perMonth")}
                        {billingCycle === "yearly" && (
                          <span className="ml-1 text-xs text-white/40">
                            (${plan.priceYearly}/yr)
                          </span>
                        )}
                      </span>
                    )}
                    {plan.priceLifetime !== undefined &&
                      (planId === "investor" || planId === "vip") && (
                      <span className="ml-1 text-sm text-white/50">
                        {plan.currency} · 1×
                        {planId === "vip" && plan.durationYears
                          ? locale === "en"
                            ? ` · ${plan.durationYears} years`
                            : ` · ${plan.durationYears} năm`
                          : ""}
                      </span>
                    )}
                  </>
                )}
              </div>
              {plan.flexiblePricing && pricingOptions && (
                <ul className="mb-4 mt-3 space-y-1.5 rounded-2xl border border-purple-500/25 bg-purple-500/10 p-3">
                  {pricingOptions.map((opt) => (
                    <li key={opt} className="flex items-start gap-2 text-xs text-purple-200">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-purple-400" />
                      {opt}
                    </li>
                  ))}
                </ul>
              )}
              {billingCycle === "yearly" && savings && (
                <div className="mb-4 text-xs font-medium text-agri-400">{savings}</div>
              )}
              {!savings && !plan.flexiblePricing && <div className="mb-4" />}
              {plan.flexiblePricing && <div className="mb-1" />}

              <p className="mb-5 text-sm text-white/50">{tagline}</p>

              {plan.disclaimerKey && (
                <div className="mb-5 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs leading-relaxed text-amber-200">
                  {t(`pricing.disclaimers.${plan.disclaimerKey}`)}
                </div>
              )}

              {plan.flexiblePricing || plan.contactOnly ? (
                <div className="mb-5 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs text-white/50">
                  {t("pricing.limitsNote")}
                </div>
              ) : (
              <div className="mb-5 grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-xs">
                {[
                  { k: "Farms", v: plan.limits.farms },
                  { k: t("subscription.evidence"), v: plan.limits.evidencePerMonth },
                  { k: "IoT", v: plan.limits.iotSensors },
                  { k: t("plans.members"), v: plan.limits.teamMembers },
                ].map(({ k, v }) => (
                  <div key={k} className="text-center">
                    <div className="font-bold text-white">
                      {v === -1 ? "∞" : v}
                    </div>
                    <div className="text-white/40">{k}</div>
                  </div>
                ))}
              </div>
              )}

              <ul className="mb-6 space-y-1.5">
                {features.map((f) => (
                  <li
                    key={f.text}
                    className={cn(
                      "flex items-center gap-2 text-xs",
                      !f.included && !f.roadmap && "opacity-40"
                    )}
                  >
                    {f.roadmap ? (
                      <Clock className="h-3.5 w-3.5 shrink-0 text-amber-400/80" />
                    ) : f.included ? (
                      <CheckCircle
                        className={cn(
                          "h-3.5 w-3.5 shrink-0",
                          f.highlight ? "text-agri-400" : "text-white/40"
                        )}
                      />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 shrink-0 text-white/25" />
                    )}
                    <span
                      className={cn(
                        f.roadmap
                          ? "text-white/45"
                          : f.highlight && f.included
                          ? "font-semibold text-agri-300"
                          : "text-white/60"
                      )}
                    >
                      {f.text}
                    </span>
                    {f.roadmap && (
                      <span className="ml-auto shrink-0 rounded-full border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-300">
                        {t("pricing.roadmapTag")}
                      </span>
                    )}
                  </li>
                ))}
              </ul>

              {plan.contactOnly ? (
                <a
                  href={`mailto:${plan.contactEmail ?? "hello@openagrix.com"}?subject=${encodeURIComponent(
                    "OpenAgriX — strategic partnership"
                  )}`}
                  className={cn(PLAN_BUTTON[planId], "inline-flex items-center gap-2")}
                >
                  <Mail className="h-4 w-4" />
                  {t("pricing.contactTeam")}
                </a>
              ) : isGuest ? (
                <div className="text-center">
                  <p className="mb-2 text-xs text-white/45">{t("pricing.connectToSubscribe")}</p>
                  <WalletMultiButton />
                </div>
              ) : isCurrentPlan ? (
                <button disabled className="w-full cursor-default rounded-full border border-agri-500/30 bg-agri-500/10 py-2.5 text-sm font-semibold text-agri-300">
                  {t("pricing.currentPlan")}
                  {daysRemaining !== null && t("pricing.daysLeft", { n: daysRemaining })}
                </button>
              ) : planId === "free" ? (
                <button disabled className="w-full cursor-default rounded-full border border-white/10 py-2.5 text-sm text-white/40">
                  {t("pricing.defaultPlan")}
                </button>
              ) : purchaseBlocked ? (
                <button disabled className="w-full cursor-default rounded-full border border-white/10 py-2.5 text-sm text-white/40">
                  {userIsVip ? t("pricing.vipLocked") : t("pricing.investorLocked")}
                </button>
              ) : (
                <button
                  onClick={() => openPayment(planId)}
                  disabled={payPlan !== null || buyerFormOpen}
                  className={cn(
                    PLAN_BUTTON[planId],
                    (payPlan === planId || (planId === "combo" && buyerFormOpen)) &&
                      "opacity-70 cursor-wait",
                    upgraded === planId && "!bg-agri-500 !text-forest-950"
                  )}
                >
                  {upgraded === planId
                    ? t("pricing.paid")
                    : plan.flexiblePricing
                    ? t("pricing.payBuyer")
                    : currentTier === "free"
                    ? t("pricing.payPlan", { name: planName })
                    : t("pricing.upgradeTo", { name: planName })}
                </button>
              )}
            </div>
          );
        })}
      </div>
      </>
      )}

      {userIsInvestor && (
        <div className="mb-10 rounded-3xl border border-white/20 bg-white/5 px-6 py-10 text-center">
          <p className="text-lg font-semibold text-white">{t("pricing.investorLocked")}</p>
        </div>
      )}

      <div className="mt-16 grid gap-6 sm:grid-cols-3">
        {[
          { title: t("pricing.trustPay"), desc: t("pricing.trustPayDesc") },
          { title: t("pricing.trustCancel"), desc: t("pricing.trustCancelDesc") },
          { title: t("pricing.trustData"), desc: t("pricing.trustDataDesc") },
        ].map((item) => (
          <div key={item.title} className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-center">
            <h3 className="mb-1 font-semibold text-white">{item.title}</h3>
            <p className="text-sm text-white/50">{item.desc}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-3xl border border-white/15 bg-gradient-to-br from-forest-800 to-forest-900 px-8 py-10 text-center">
        <p className="section-eyebrow justify-center !mb-4">Partnership</p>
        <h2 className="mb-2 text-2xl font-bold text-white">{t("pricing.investorTitle")}</h2>
        <p className="mx-auto mb-4 max-w-lg text-white/50">{t("pricing.investorDesc")}</p>
        <p className="mx-auto mb-6 max-w-lg text-xs text-white/35">
          {t("pricing.disclaimers.investorNotSecurity")}
        </p>
        <a
          href="mailto:hello@openagrix.com?subject=OpenAgriX%20partnership%20inquiry"
          className="btn-primary"
        >
          <Shield className="h-4 w-4" />
          {t("pricing.investorCta")}
        </a>
      </div>
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-white/45">…</div>
      </div>
    }>
      <PricingContent />
    </Suspense>
  );
}
