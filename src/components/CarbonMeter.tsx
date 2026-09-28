"use client";

import { useTranslation } from "@/i18n/LanguageProvider";

interface CarbonMeterProps {
  kgCO2: number;
  /** Optional target (e.g. annual goal) */
  targetKgCO2?: number;
  label?: string;
}

export function CarbonMeter({
  kgCO2,
  targetKgCO2 = 5000,
  label,
}: CarbonMeterProps) {
  const { t, locale } = useTranslation();
  const displayLabel = label ?? t("carbon.label");
  const pct = Math.min((kgCO2 / targetKgCO2) * 100, 100);

  // Color ramp: low = amber, high = green
  const barColor =
    pct >= 80
      ? "bg-agri-500"
      : pct >= 50
      ? "bg-agri-400"
      : pct >= 20
      ? "bg-yellow-400"
      : "bg-amber-400";

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-medium text-white/70">{displayLabel}</span>
        <span className="font-bold text-agri-400">
          {kgCO2.toLocaleString(locale)} kgCO₂eq
        </span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full transition-all duration-700 ${barColor}`}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={kgCO2}
          aria-valuemax={targetKgCO2}
          aria-label={displayLabel}
        />
      </div>
      <p className="mt-1.5 text-right text-xs text-white/40">
        {t("carbon.ofTarget", {
          pct: pct.toFixed(1),
          target: targetKgCO2.toLocaleString(locale),
        })}
      </p>
    </div>
  );
}
