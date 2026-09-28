"use client";

import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import {
  SUBSCRIPTION_PLANS,
  TREASURY_WALLET,
  explorerTxUrl,
  getPlanUsdAmount,
  type BillingCycle,
  type SubscriptionTier,
} from "@/lib/constants";
import {
  usePayment,
  type PaymentAsset,
  type PaymentQuote,
  type PaymentResult,
  formatSol,
  formatUsdc,
} from "@/hooks/usePayment";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/LanguageProvider";

interface PaymentModalProps {
  planId: SubscriptionTier;
  billingCycle: BillingCycle;
  onClose: () => void;
  /** Receives the full result so the quote can be re-verified on-chain */
  onSuccess: (result: PaymentResult) => void;
}

export function PaymentModal({
  planId,
  billingCycle,
  onClose,
  onSuccess,
}: PaymentModalProps) {
  const { t, locale } = useTranslation();
  const plan = SUBSCRIPTION_PLANS[planId];
  const usdAmount = getPlanUsdAmount(plan, billingCycle);
  const { pay, buildQuote, loading, error, setError } = usePayment();

  const [asset, setAsset] = useState<PaymentAsset>("USDC");
  const [quote, setQuote] = useState<PaymentQuote | null>(null);
  const [quoting, setQuoting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setQuoting(true);
      setError(null);
      try {
        const q = await buildQuote(planId, billingCycle, asset);
        if (!cancelled) setQuote(q);
      } catch (e) {
        if (!cancelled) {
          setQuote(null);
          setError(e instanceof Error ? e.message : String(e));
        }
      } finally {
        if (!cancelled) setQuoting(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [planId, billingCycle, asset, buildQuote, setError]);

  const handlePay = async () => {
    const result = await pay(planId, billingCycle, asset);
    if (result?.signature) onSuccess(result);
  };

  const cycleLabel =
    planId === "vip"
      ? t("payment.fiveYears")
      : billingCycle === "lifetime"
        ? t("payment.forever")
        : billingCycle === "yearly"
          ? t("payment.byYear")
          : t("payment.byMonth");

  const planName = locale === "en" ? plan.name : plan.nameVi;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-3xl border border-white/15 bg-forest-900 p-6 shadow-glow">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1.5 text-white/50 hover:bg-white/10 hover:text-white"
          aria-label={t("common.close")}
        >
          <X className="h-5 w-5" />
        </button>

        <p className="section-eyebrow">{t("payment.eyebrow")}</p>
        <h2 className="mb-1 text-xl font-extrabold text-white">{planName}</h2>
        <p className="mb-5 text-sm text-white/50">
          {cycleLabel} · ${usdAmount.toLocaleString()} USD
        </p>

        <div className="mb-4 grid grid-cols-2 gap-2">
          {(["USDC", "SOL"] as PaymentAsset[]).map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setAsset(a)}
              className={cn(
                "rounded-2xl border px-3 py-3 text-sm font-semibold transition-colors",
                asset === a
                  ? "border-agri-500/50 bg-agri-500/15 text-agri-300"
                  : "border-white/10 bg-white/[0.03] text-white/60 hover:border-white/20"
              )}
            >
              {a === "USDC" ? t("payment.usdc") : t("payment.sol")}
            </button>
          ))}
        </div>

        <div className="mb-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm">
          {quoting || !quote ? (
            <div className="flex items-center gap-2 text-white/50">
              <Loader2 className="h-4 w-4 animate-spin text-agri-400" />
              {asset === "SOL" ? t("payment.loadingSol") : t("payment.loadingUsdc")}
            </div>
          ) : asset === "USDC" ? (
            <div className="space-y-1.5 text-white/70">
              <div className="flex justify-between">
                <span>{t("payment.payLabel")}</span>
                <span className="font-semibold text-white">{formatUsdc(quote.usdcAmount ?? usdAmount)}</span>
              </div>
              <p className="text-xs text-white/40">{t("payment.usdcHint")}</p>
            </div>
          ) : (
            <div className="space-y-1.5 text-white/70">
              <div className="flex justify-between">
                <span>{t("payment.solUsd")}</span>
                <span className="font-mono text-agri-300">
                  ${quote.solUsdPrice?.toFixed(4)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>{t("payment.solAmount")}</span>
                <span className="font-semibold text-white">
                  {quote.lamports != null ? formatSol(quote.lamports) : "—"}
                </span>
              </div>
              <p className="text-xs text-white/40">{t("payment.solHint")}</p>
            </div>
          )}
        </div>

        <p className="mb-4 break-all text-xs text-white/35">
          {t("payment.to")}{" "}
          <span className="font-mono text-white/55">{TREASURY_WALLET.toBase58()}</span>
        </p>

        {error && (
          <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            {error.startsWith("paymentErrors.") ? t(error) : error}
          </div>
        )}

        <button
          type="button"
          onClick={handlePay}
          disabled={loading || quoting || !quote}
          className="btn-primary w-full justify-center disabled:cursor-wait disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> {t("payment.sending")}
            </>
          ) : (
            t("payment.payWith", { asset })
          )}
        </button>

        <p className="mt-3 text-center text-[11px] text-white/30">
          {t("payment.footerNote")}
        </p>
      </div>
    </div>
  );
}

export function PaymentSuccessNote({ signature }: { signature: string }) {
  const { t } = useTranslation();
  return (
    <a
      href={explorerTxUrl(signature)}
      target="_blank"
      rel="noreferrer"
      className="text-agri-400 underline underline-offset-2 hover:text-agri-300"
    >
      {t("pricing.viewTx")}
    </a>
  );
}
