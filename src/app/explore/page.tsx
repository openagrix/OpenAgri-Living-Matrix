"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Search, X } from "lucide-react";
import { useFarm } from "@/hooks/useFarm";
import { useEvidence } from "@/hooks/useEvidence";
import { formatDate, evidenceTypeFromAnchor } from "@/lib/utils";
import { explorerAccountUrl } from "@/lib/constants";
import type { FarmWithPubkey, EvidenceWithPubkey, EvidenceTypeKey } from "@/types/openagri";
import { EvidenceBadge } from "@/components/EvidenceBadge";
import { FarmCarousel } from "@/components/FarmCarousel";
import { EvidenceGrid } from "@/components/EvidenceGrid";
import { useTranslation } from "@/i18n/LanguageProvider";

export default function ExplorePage() {
  const { fetchAllFarms } = useFarm();
  const { fetchAllEvidence } = useEvidence();
  const { t } = useTranslation();

  const [farms, setFarms] = useState<FarmWithPubkey[]>([]);
  const [evidence, setEvidence] = useState<EvidenceWithPubkey[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"farms" | "evidence">("farms");

  const load = useCallback(async () => {
    setLoading(true);
    const [farmData, evidenceData] = await Promise.all([
      fetchAllFarms(),
      fetchAllEvidence(),
    ]);
    setFarms(farmData);
    setEvidence(evidenceData);
    setLoading(false);
  }, [fetchAllFarms, fetchAllEvidence]);

  useEffect(() => {
    load();
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [load]);

  const q = search.toLowerCase().trim();
  const filteredFarms = q
    ? farms.filter(
        (f) =>
          f.account.name.toLowerCase().includes(q) ||
          f.account.location.toLowerCase().includes(q) ||
          f.account.cropTypes.toLowerCase().includes(q) ||
          f.account.farmId.toLowerCase().includes(q)
      )
    : farms;

  const filteredEvidence = q
    ? evidence.filter((e) => e.account.summary.toLowerCase().includes(q))
    : evidence;

  const totalCarbon = evidence
    .filter((e) => "carbon" in (e.account.evidenceType as Record<string, unknown>))
    .reduce((s, e) => s + e.account.quantity, 0);
  const uniqueOwners = new Set(farms.map((f) => f.account.owner.toBase58())).size;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-8">
        <p className="section-eyebrow">{t("explore.eyebrow")}</p>
        <h1 className="text-3xl font-extrabold text-white">{t("explore.title")}</h1>
        <p className="mt-2 text-white/50">{t("explore.subtitle")}</p>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { value: farms.length, label: t("explore.farms") },
          { value: uniqueOwners, label: t("explore.owners") },
          { value: evidence.length, label: t("explore.evidence") },
          { value: `${(totalCarbon / 1000).toFixed(1)}t`, label: t("explore.carbon") },
        ].map((s) => (
          <div key={s.label} className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 text-center">
            <div className="text-2xl font-bold text-agri-400">{loading ? "—" : s.value}</div>
            <div className="mt-0.5 text-xs text-white/45">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
        <input
          type="text"
          placeholder={t("explore.searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="field-input pl-11 pr-10"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="mb-6 flex gap-2 border-b border-white/10">
        {(["farms", "evidence"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`-mb-px border-b-2 px-4 pb-3 text-sm font-medium transition-colors ${
              activeTab === tab
                ? "border-agri-500 text-agri-400"
                : "border-transparent text-white/45 hover:text-white/70"
            }`}
          >
            {tab === "farms"
              ? `${t("explore.tabFarms")} (${loading ? "…" : filteredFarms.length})`
              : `${t("explore.tabEvidence")} (${loading ? "…" : filteredEvidence.length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-agri-400" />
          <span className="ml-3 text-white/50">{t("common.loadingSolana")}</span>
        </div>
      ) : activeTab === "farms" ? (
        <FarmCarousel
          farms={filteredFarms}
          emptyMessage={
            search
              ? t("explore.noFarmMatch", { q: search })
              : t("explore.emptyFarms")
          }
        />
      ) : filteredEvidence.length === 0 ? (
        <EmptyState
          message={
            search
              ? t("explore.noEvidenceMatch", { q: search })
              : t("explore.emptyEvidence")
          }
        />
      ) : (
        <EvidenceGrid count={filteredEvidence.length}>
          {filteredEvidence.map((ev) => (
            <EvidenceExplorerCard key={ev.publicKey.toBase58()} evidence={ev} />
          ))}
        </EvidenceGrid>
      )}
    </div>
  );
}

function EvidenceExplorerCard({ evidence }: { evidence: EvidenceWithPubkey }) {
  const { locale } = useTranslation();
  const { account, publicKey } = evidence;
  const typeKey = evidenceTypeFromAnchor(
    account.evidenceType as Record<string, unknown>
  ) as EvidenceTypeKey;

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 transition-colors hover:border-agri-500/30 hover:bg-white/[0.05]">
      <div className="mb-3 flex items-start justify-between">
        <EvidenceBadge type={typeKey} size="sm" />
        <span className="text-xs text-white/40">#{account.sequence}</span>
      </div>

      <p className="mb-3 line-clamp-2 text-sm font-medium text-white/85">{account.summary}</p>

      <div className="mb-3 flex items-baseline gap-1.5">
        <span className="text-2xl font-bold text-agri-400">
          {account.quantity.toLocaleString()}
        </span>
        <span className="text-sm text-white/45">{account.unit}</span>
      </div>

      <div className="flex items-center justify-between border-t border-white/10 pt-3 text-xs text-white/40">
        <span>{formatDate(account.submittedAt, locale)}</span>
        <a
          href={explorerAccountUrl(publicKey.toBase58())}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="font-medium text-agri-400 transition-colors hover:text-agri-300"
        >
          Verify on-chain →
        </a>
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  const { t } = useTranslation();
  return (
    <div className="py-20 text-center">
      <p className="text-white/45">{message}</p>
      <Link href="/farm/register" className="btn-primary mt-6">
        {t("explore.registerFirst")}
      </Link>
    </div>
  );
}
