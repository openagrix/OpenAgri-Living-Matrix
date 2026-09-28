"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import { FarmCard } from "@/components/FarmCard";
import { useTranslation } from "@/i18n/LanguageProvider";
import type { FarmWithPubkey } from "@/types/openagri";

interface FarmCarouselProps {
  farms: FarmWithPubkey[];
  loading?: boolean;
  emptyMessage?: string;
}

/**
 * Horizontal farm row — ~3 cards visible, scroll to see the rest.
 * Always shows every farm returned (no hard cap).
 */
export function FarmCarousel({
  farms,
  loading,
  emptyMessage,
}: FarmCarouselProps) {
  const { t } = useTranslation();
  const empty = emptyMessage ?? t("explore.emptyFarms");

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-7 w-7 animate-spin text-agri-400" />
        <span className="ml-3 text-sm text-white/50">{t("common.loadingSolana")}</span>
      </div>
    );
  }

  if (farms.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-white/15 px-6 py-14 text-center">
        <p className="text-sm text-white/45">{empty}</p>
        <Link href="/farm/register" className="btn-primary mt-5 inline-flex">
          {t("explore.registerFirst")}
        </Link>
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        className="flex gap-4 overflow-x-auto pb-3 scroll-smooth snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-agri-500/40"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {farms.map((farm) => (
          <div
            key={farm.publicKey.toBase58()}
            className="w-[min(100%,20rem)] shrink-0 snap-start sm:w-[calc((100%-2rem)/2)] lg:w-[calc((100%-2rem)/3)]"
          >
            <FarmCard farm={farm} />
          </div>
        ))}
      </div>
      {farms.length > 3 && (
        <p className="mt-2 text-center text-xs text-white/35">
          {t("explore.scrollHint", { n: farms.length })}
        </p>
      )}
    </div>
  );
}
