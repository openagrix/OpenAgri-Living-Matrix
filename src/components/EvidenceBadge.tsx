"use client";

import { cn } from "@/lib/utils";
import { EVIDENCE_TYPE_MAP, type EvidenceTypeKey } from "@/types/openagri";
import { useTranslation } from "@/i18n/LanguageProvider";

interface EvidenceBadgeProps {
  type: EvidenceTypeKey;
  size?: "sm" | "md";
}

/** Dark-theme chip colors (overrides light-only meta.color) */
const DARK_COLORS: Record<EvidenceTypeKey, string> = {
  Harvest: "text-yellow-300 border-yellow-500/30 bg-yellow-500/10",
  Soil: "text-amber-300 border-amber-500/30 bg-amber-500/10",
  Carbon: "text-agri-300 border-agri-500/30 bg-agri-500/10",
  Water: "text-sky-300 border-sky-500/30 bg-sky-500/10",
  Biodiversity: "text-purple-300 border-purple-500/30 bg-purple-500/10",
  HoneyQuality: "text-orange-300 border-orange-500/30 bg-orange-500/10",
  ProduceQuality: "text-rose-300 border-rose-500/30 bg-rose-500/10",
};

export function EvidenceBadge({ type, size = "md" }: EvidenceBadgeProps) {
  const { locale } = useTranslation();
  const meta = EVIDENCE_TYPE_MAP[type];
  const label = locale === "en" ? meta.label : meta.labelVi;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium",
        DARK_COLORS[type],
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm"
      )}
    >
      <span>{meta.icon}</span>
      {label}
    </span>
  );
}
