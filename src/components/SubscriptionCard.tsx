"use client";

import Link from "next/link";
import { CheckCircle, XCircle, Crown, ArrowUpRight, AlertTriangle, Clock } from "lucide-react";
import { SUBSCRIPTION_PLANS, getPlanPrice, type SubscriptionTier } from "@/lib/constants";
import { useSubscription } from "@/hooks/useSubscription";
import { useTranslation } from "@/i18n/LanguageProvider";
import { PLAN_EN } from "@/i18n/plans.en";
import { cn } from "@/lib/utils";

interface SubscriptionCardProps {
  walletAddress: string;
  farmCount: number;
  compact?: boolean;
}

const TIER_ICONS: Record<SubscriptionTier, React.ReactNode> = {
  free: <span className="text-lg">🌱</span>,
  monthly: <span className="text-lg">📅</span>,
  yearly: <span className="text-lg">📆</span>,
  combo: <span className="text-lg">🌐</span>,
  vip: <Crown className="h-5 w-5 text-amber-400" />,
  investor: <span className="text-lg">💎</span>,
};

const UPGRADE_TARGET: Partial<Record<SubscriptionTier, SubscriptionTier>> = {
  free: "monthly",
  monthly: "yearly",
  yearly: "combo",
  combo: "vip",
  vip: "investor",
};

export function SubscriptionCard({ walletAddress, farmCount, compact = false }: SubscriptionCardProps) {
  const { t, locale } = useTranslation();
  const {
    entitlements,
    tier,
    plan,
    daysRemaining,
    effectiveLimits,
    isVip,
    isInvestor,
    hidePricing,
  } = useSubscription(walletAddress);

  const upgradeTarget = hidePricing ? undefined : UPGRADE_TARGET[tier];
  const upgradePlan = upgradeTarget ? SUBSCRIPTION_PLANS[upgradeTarget] : null;
  const planName = locale === "en" ? plan.name : plan.nameVi;
  const planBadge =
    locale === "en" && PLAN_EN[tier]?.badge ? PLAN_EN[tier].badge : plan.badge;
  const upgradeName = upgradePlan
    ? locale === "en"
      ? upgradePlan.name
      : upgradePlan.nameVi
    : "";

  const farmsLimit = effectiveLimits.farms;
  const evidenceLimit = effectiveLimits.evidencePerMonth;
  const isLifetime =
    isInvestor || (tier !== "free" && entitlements.expiresAt === null && !entitlements.isVip);

  if (compact) {
    return (
      <div
        className={cn(
          "rounded-3xl border p-5",
          isInvestor
            ? "border-white/20 bg-gradient-to-br from-forest-800 to-forest-900"
            : isVip
              ? "border-amber-500/30 bg-amber-500/[0.08]"
              : tier === "combo"
                ? "border-purple-500/30 bg-purple-500/[0.08]"
                : "border-white/10 bg-white/[0.03]"
        )}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {TIER_ICONS[tier]}
            <div>
              <p className="text-sm font-bold text-white">{planName}</p>
              <p className="text-xs text-white/45">
                {isLifetime
                  ? t("subscription.lifetimeAccess")
                  : daysRemaining != null
                    ? t("subscription.stackedDays", { n: daysRemaining })
                    : t("subscription.currentPlan")}
              </p>
            </div>
          </div>
          {planBadge && (
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-semibold",
                isVip
                  ? "border border-amber-500/30 bg-amber-500/15 text-amber-300"
                  : tier === "combo"
                    ? "border border-purple-500/30 bg-purple-500/15 text-purple-300"
                    : isInvestor
                      ? "border border-white/20 bg-white/10 text-white"
                      : "border border-agri-500/20 bg-agri-500/10 text-agri-300"
              )}
            >
              {planBadge}
            </span>
          )}
        </div>

        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-white/35">
          {t("subscription.profileQuota")}
        </p>
        <div className="mb-4 grid grid-cols-2 gap-2.5">
          {[
            {
              label: t("subscription.farms"),
              used: farmCount,
              limit: farmsLimit,
            },
            {
              label: t("subscription.evidence"),
              used: null,
              limit: evidenceLimit,
            },
          ].map(({ label, used, limit }) => (
            <div
              key={label}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-2.5 text-center"
            >
              <div className="text-base font-bold text-white">
                {limit === -1
                  ? "∞"
                  : used !== null
                    ? `${used}/${limit}`
                    : limit}
              </div>
              <div className="mt-0.5 text-xs text-white/40">{label}</div>
            </div>
          ))}
        </div>

        {!isLifetime && daysRemaining !== null && daysRemaining <= 7 && (
          <div className="mb-3 flex items-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            {t("subscription.expiresSoon", { n: daysRemaining })}
          </div>
        )}
        {!isLifetime && daysRemaining !== null && daysRemaining > 7 && daysRemaining <= 30 && (
          <div className="mb-3 flex items-center gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            {t("subscription.stackedDays", { n: daysRemaining })}
          </div>
        )}

        {farmsLimit !== -1 && farmCount >= farmsLimit && (
          <div className="mb-3 flex items-center gap-2 rounded-2xl border border-orange-500/30 bg-orange-500/10 px-3 py-2 text-xs text-orange-300">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            {t("subscription.farmLimit", { n: farmsLimit })}
          </div>
        )}

        {!hidePricing && (
          <div className="flex gap-2">
            <Link
              href="/pricing"
              className={cn(
                "flex-1 rounded-full py-2 text-center text-sm font-semibold transition-colors",
                tier === "free"
                  ? "bg-agri-500 text-forest-950 hover:bg-agri-400"
                  : "border border-white/15 bg-white/5 text-white hover:bg-white/10"
              )}
            >
              {tier === "free" ? t("subscription.upgradeNow") : t("subscription.managePlan")}
            </Link>
            {upgradePlan && (
              <Link
                href={`/pricing?highlight=${upgradeTarget}`}
                className="flex items-center gap-1 rounded-full border border-agri-500/30 px-3 py-2 text-xs font-medium text-agri-400 transition-colors hover:bg-agri-500/10"
              >
                <ArrowUpRight className="h-3.5 w-3.5" />
                {upgradeName}
              </Link>
            )}
          </div>
        )}
        {hidePricing && (
          <div className="rounded-full border border-white/15 bg-white/5 py-2 text-center text-sm font-semibold text-white/70">
            {t("subscription.viewBenefits")}
          </div>
        )}
      </div>
    );
  }

  const en = PLAN_EN[tier];
  const fullTagline = locale === "en" && en ? en.tagline : plan.tagline;
  const fullFeatures = plan.features.map((f, i) => ({
    ...f,
    text: locale === "en" && en?.features[i] ? en.features[i] : f.text,
  }));

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
      <div className="mb-5 flex items-start justify-between">
        <div className="flex items-center gap-3">
          {TIER_ICONS[tier]}
          <div>
            <h3 className="font-bold text-white">{planName}</h3>
            <p className="text-sm text-white/50">{fullTagline}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold text-white">
            {getPlanPrice(plan, "monthly", locale)}
          </div>
          {isLifetime ? (
            <div className="text-xs text-agri-400">{t("subscription.lifetimeAccess")}</div>
          ) : entitlements.expiresAt ? (
            <div className="text-xs text-white/40">
              {t("subscription.expires")}{" "}
              {new Date(entitlements.expiresAt).toLocaleDateString(
                locale === "en" ? "en-US" : "vi-VN"
              )}
            </div>
          ) : null}
        </div>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-2">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-center">
          <div className="text-lg font-bold text-white">
            {farmsLimit === -1 ? "∞" : farmsLimit}
          </div>
          <div className="text-xs text-white/40">{t("subscription.farms")}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-center">
          <div className="text-lg font-bold text-white">
            {evidenceLimit === -1 ? "∞" : evidenceLimit}
          </div>
          <div className="text-xs text-white/40">{t("subscription.evidence")}</div>
        </div>
      </div>

      <div className="mb-5 space-y-2">
        {fullFeatures.map((f) => (
          <div
            key={f.text}
            className={cn(
              "flex items-center gap-2 text-sm",
              f.included ? "text-white/70" : "text-white/25"
            )}
          >
            {f.included ? (
              <CheckCircle
                className={cn(
                  "h-4 w-4 shrink-0",
                  f.highlight ? "text-agri-400" : "text-white/40"
                )}
              />
            ) : (
              <XCircle className="h-4 w-4 shrink-0" />
            )}
            <span className={f.highlight && f.included ? "font-medium text-agri-300" : ""}>
              {f.text}
            </span>
          </div>
        ))}
      </div>

      {!hidePricing && (
        <Link href="/pricing" className="btn-primary w-full justify-center">
          {tier === "free" ? t("subscription.explorePlans") : t("subscription.manageSub")}
        </Link>
      )}
    </div>
  );
}
