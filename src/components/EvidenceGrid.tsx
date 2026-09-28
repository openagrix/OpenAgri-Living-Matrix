"use client";

import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/LanguageProvider";

interface EvidenceGridProps {
  children: React.ReactNode;
  /** Total evidence count — enables vertical scroll when > 6 */
  count: number;
  className?: string;
}

/**
 * Evidence layout: 3 cards per row.
 * When more than 6 items, container shows ~2 rows and scrolls vertically.
 */
export function EvidenceGrid({ children, count, className }: EvidenceGridProps) {
  const { t } = useTranslation();
  const scrollable = count > 6;

  return (
    <div className={className}>
      <div
        className={cn(
          "grid gap-4 sm:grid-cols-2 lg:grid-cols-3",
          scrollable &&
            "max-h-[36rem] overflow-y-auto overscroll-contain pr-1 scroll-smooth [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-agri-500/40"
        )}
      >
        {children}
      </div>
      {scrollable && (
        <p className="mt-2 text-center text-xs text-white/35">
          {t("explore.evidenceScroll", { n: count })}
        </p>
      )}
    </div>
  );
}
