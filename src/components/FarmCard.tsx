"use client";

import Link from "next/link";
import { MapPin, ArrowRight } from "lucide-react";
import { formatDate, formatArea, cropLabel } from "@/lib/utils";
import { useTranslation } from "@/i18n/LanguageProvider";
import type { FarmWithPubkey } from "@/types/openagri";

interface FarmCardProps {
  farm: FarmWithPubkey;
}

export function FarmCard({ farm }: FarmCardProps) {
  const { t, locale } = useTranslation();
  const { account, publicKey } = farm;
  const crops = account.cropTypes.split(",").filter(Boolean);

  return (
    <div className="flex h-full flex-col rounded-3xl border border-white/10 bg-white/[0.03] p-6 transition-colors hover:border-agri-500/30 hover:bg-white/[0.05]">
      <h3 className="mb-1 line-clamp-1 text-lg font-bold text-white">{account.name}</h3>
      <div className="mb-4 flex items-center gap-1.5 text-sm text-white/50">
        <MapPin className="h-3.5 w-3.5 shrink-0" />
        <span className="line-clamp-1">{account.location}</span>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-3 rounded-2xl border border-white/5 bg-forest-950/40 p-3">
        <div className="text-center">
          <div className="text-lg font-bold text-agri-400">{account.evidenceCount}</div>
          <div className="text-xs text-white/40">Evidence</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-agri-400">{formatArea(account.areaM2)}</div>
          <div className="text-xs text-white/40">{t("farmCard.area")}</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-agri-400">{crops.length}</div>
          <div className="text-xs text-white/40">{t("farmCard.crops")}</div>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {crops.slice(0, 4).map((crop) => (
          <span
            key={crop}
            className="rounded-full border border-agri-500/20 bg-agri-500/10 px-2 py-0.5 text-xs text-agri-300"
          >
            {cropLabel(crop, locale)}
          </span>
        ))}
        {crops.length > 4 && (
          <span className="rounded-full border border-white/10 px-2 py-0.5 text-xs text-white/40">
            +{crops.length - 4}
          </span>
        )}
      </div>

      <div className="mt-auto flex items-center justify-between">
        <span className="text-xs text-white/35">
          {t("farmCard.registered", { date: formatDate(account.createdAt, locale) })}
        </span>
        <Link
          href={`/farm/${account.owner.toBase58()}?farmId=${account.farmId}`}
          className="flex items-center gap-1 text-sm font-medium text-agri-400 transition-colors hover:text-agri-300"
        >
          {t("farmCard.view")}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <span className="sr-only">{publicKey.toBase58()}</span>
    </div>
  );
}
