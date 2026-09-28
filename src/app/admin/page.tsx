"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Shield, Loader2, RefreshCw, ExternalLink, Users, Leaf, FileText, TrendingUp, MapPin, Clock } from "lucide-react";
import { useRole } from "@/hooks/useRole";
import { useFarm } from "@/hooks/useFarm";
import { useEvidence } from "@/hooks/useEvidence";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { EvidenceBadge } from "@/components/EvidenceBadge";
import { formatDate, formatArea, evidenceTypeFromAnchor } from "@/lib/utils";
import { explorerAccountUrl } from "@/lib/constants";
import type { FarmWithPubkey, EvidenceWithPubkey, EvidenceTypeKey } from "@/types/openagri";
import { useTranslation } from "@/i18n/LanguageProvider";

export default function AdminPage() {
  const { isAdmin, isGuest, walletAddress } = useRole();
  const { fetchAllFarms } = useFarm();
  const { fetchAllEvidence } = useEvidence();
  const { t, locale } = useTranslation();

  const [farms, setFarms] = useState<FarmWithPubkey[]>([]);
  const [evidence, setEvidence] = useState<EvidenceWithPubkey[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "farms" | "evidence">("overview");

  const load = async () => {
    setLoading(true);
    const [f, e] = await Promise.all([fetchAllFarms(), fetchAllEvidence()]);
    setFarms(f);
    setEvidence(e);
    setLastRefresh(new Date());
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin]);

  // ── Access control ──────────────────────────────────────────────────────────
  if (isGuest) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-4">
        <Shield className="h-12 w-12 text-white/25" />
        <h1 className="text-xl font-bold text-white">{t("admin.guestTitle")}</h1>
        <p className="text-sm text-white/50">{t("admin.connectWallet")}</p>
        <WalletMultiButton />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <Shield className="h-12 w-12 text-red-400/40" />
        <h1 className="text-xl font-bold text-white">{t("admin.noAccessTitle")}</h1>
        <p className="text-sm text-white/50">
          <code className="mr-1 rounded bg-white/10 px-1.5 py-0.5 font-mono text-xs text-white/70">{walletAddress?.slice(0, 12)}...</code>
          {t("admin.noAccessBody")}
        </p>
        <Link href="/" className="text-sm text-agri-400 hover:underline">{t("admin.backHome")}</Link>
      </div>
    );
  }

  // ── Computed stats ──────────────────────────────────────────────────────────
  const uniqueOwners = new Set(farms.map((f) => f.account.owner.toBase58())).size;
  const totalCarbon = evidence.filter((e) => "carbon" in (e.account.evidenceType as Record<string, unknown>)).reduce((s, e) => s + e.account.quantity, 0);
  const totalHarvest = evidence.filter((e) => "harvest" in (e.account.evidenceType as Record<string, unknown>)).reduce((s, e) => s + e.account.quantity, 0);
  const totalArea = farms.reduce((s, f) => s + f.account.areaM2, 0);
  const evidenceByType = {
    harvest: evidence.filter((e) => "harvest" in (e.account.evidenceType as Record<string, unknown>)).length,
    soil: evidence.filter((e) => "soil" in (e.account.evidenceType as Record<string, unknown>)).length,
    carbon: evidence.filter((e) => "carbon" in (e.account.evidenceType as Record<string, unknown>)).length,
    water: evidence.filter((e) => "water" in (e.account.evidenceType as Record<string, unknown>)).length,
    biodiversity: evidence.filter((e) => "biodiversity" in (e.account.evidenceType as Record<string, unknown>)).length,
    honeyQuality: evidence.filter((e) => "honeyQuality" in (e.account.evidenceType as Record<string, unknown>)).length,
    produceQuality: evidence.filter((e) => "produceQuality" in (e.account.evidenceType as Record<string, unknown>)).length,
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">

      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <div className="mb-1 flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1">
              <Shield className="h-4 w-4 text-red-400" />
              <span className="text-sm font-semibold text-red-300">Administrator</span>
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-white">Admin Dashboard</h1>
          <p className="mt-1 text-white/50">
            {t("admin.subtitle")}
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="btn-ghost disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          {t("admin.refresh")}
        </button>
      </div>

      {/* Stats cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { icon: Leaf, label: t("admin.farms"), value: farms.length, accent: "text-agri-400" },
          { icon: Users, label: t("admin.owners"), value: uniqueOwners, accent: "text-sky-400" },
          { icon: FileText, label: t("admin.evidenceRecords"), value: evidence.length, accent: "text-purple-400" },
          { icon: TrendingUp, label: t("admin.carbon"), value: totalCarbon.toLocaleString(), accent: "text-agri-400" },
        ].map((s) => (
          <div key={s.label} className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <s.icon className={`mb-3 h-5 w-5 ${s.accent} opacity-80`} />
            <div className={`text-2xl font-bold ${s.accent}`}>{loading ? "—" : s.value}</div>
            <div className="mt-1 text-xs font-medium text-white/45">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Secondary stats */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: t("admin.totalArea"), value: `${(totalArea / 10000).toFixed(1)} ha` },
          { label: t("admin.totalHarvest"), value: `${(totalHarvest / 1000).toFixed(1)} ${t("admin.tons")}` },
          ...Object.entries(evidenceByType).map(([k, v]) => ({
            label: k.charAt(0).toUpperCase() + k.slice(1),
            value: `${v} records`,
          })),
        ].map((s) => (
          <div key={s.label} className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-lg font-bold text-white">{loading ? "—" : s.value}</div>
            <div className="mt-0.5 text-xs text-white/40">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Last refresh */}
      {lastRefresh && (
        <p className="mb-6 flex items-center gap-1 text-xs text-white/40">
          <Clock className="h-3 w-3" />
          {t("admin.updatedAt", {
            time: lastRefresh.toLocaleTimeString(locale === "en" ? "en-US" : "vi-VN"),
          })}
        </p>
      )}

      {/* Tabs */}
      <div className="mb-6 flex gap-1 border-b border-white/10">
        {(["overview", "farms", "evidence"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab ? "border-agri-500 text-agri-400" : "border-transparent text-white/45 hover:text-white/70"
            }`}
          >
            {tab === "overview"
              ? t("admin.overview")
              : tab === "farms"
                ? `${t("admin.farmsTab")} (${farms.length})`
                : `Evidence (${evidence.length})`}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-agri-400" />
          <span className="ml-3 text-white/50">{t("admin.loading")}</span>
        </div>
      ) : activeTab === "overview" ? (
        <OverviewTab farms={farms} evidence={evidence} />
      ) : activeTab === "farms" ? (
        <FarmsTable farms={farms} />
      ) : (
        <EvidenceTable evidence={evidence} />
      )}
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function OverviewTab({ farms, evidence }: { farms: FarmWithPubkey[]; evidence: EvidenceWithPubkey[] }) {
  const { t, locale } = useTranslation();
  // Top 5 farms by evidence count
  const topFarms = [...farms].sort((a, b) => b.account.evidenceCount - a.account.evidenceCount).slice(0, 5);
  // Recent evidence
  const recent = evidence.slice(0, 8);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Top farms */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="mb-4 font-bold text-white">{t("admin.topFarms")}</h2>
        {topFarms.length === 0 ? (
          <p className="text-sm text-white/40">{t("admin.noData")}</p>
        ) : (
          <div className="space-y-3">
            {topFarms.map((f, i) => (
              <div key={f.publicKey.toBase58()} className="flex items-center gap-3">
                <span className="w-6 text-sm font-bold text-white/25">#{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <Link href={`/farm/${f.account.owner.toBase58()}?farmId=${f.account.farmId}`}
                    className="block truncate text-sm font-medium text-agri-400 hover:underline">
                    {f.account.name}
                  </Link>
                  <div className="flex items-center gap-1 text-xs text-white/40">
                    <MapPin className="h-3 w-3" />
                    <span className="truncate">{f.account.location}</span>
                  </div>
                </div>
                <span className="shrink-0 rounded-full border border-agri-500/20 bg-agri-500/10 px-2 py-0.5 text-xs font-semibold text-agri-300">
                  {f.account.evidenceCount} {t("admin.records")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent evidence */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="mb-4 font-bold text-white">{t("admin.recentEvidence")}</h2>
        {recent.length === 0 ? (
          <p className="text-sm text-white/40">{t("admin.noData")}</p>
        ) : (
          <div className="space-y-2.5">
            {recent.map((e) => {
              const typeKey = evidenceTypeFromAnchor(e.account.evidenceType as Record<string, unknown>) as EvidenceTypeKey;
              return (
                <div key={e.publicKey.toBase58()} className="flex items-center gap-2.5">
                  <EvidenceBadge type={typeKey} size="sm" />
                  <span className="min-w-0 flex-1 truncate text-xs text-white/60">{e.account.summary}</span>
                  <a href={explorerAccountUrl(e.publicKey.toBase58())} target="_blank" rel="noreferrer"
                    className="shrink-0 text-agri-400/60 hover:text-agri-400">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function FarmsTable({ farms }: { farms: FarmWithPubkey[] }) {
  const { t, locale } = useTranslation();
  if (!farms.length) return <EmptyState text={t("admin.emptyFarms")} />;
  return (
    <div className="overflow-x-auto rounded-3xl border border-white/10">
      <table className="w-full text-sm">
        <thead className="bg-white/[0.04] text-xs uppercase tracking-wide text-white/45">
          <tr>
            {[
              t("admin.farmName"),
              "Farm ID",
              t("admin.location"),
              t("admin.crops"),
              t("admin.area"),
              "Evidence",
              t("admin.registered"),
              t("admin.actions"),
            ].map((h) => (
              <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {farms.map((f) => (
            <tr key={f.publicKey.toBase58()} className="bg-white/[0.02] transition-colors hover:bg-white/[0.05]">
              <td className="max-w-[160px] truncate px-4 py-3 font-medium text-white">{f.account.name}</td>
              <td className="px-4 py-3 font-mono text-xs text-agri-400">#{f.account.farmId}</td>
              <td className="max-w-[140px] truncate px-4 py-3 text-white/50">{f.account.location}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  {f.account.cropTypes.split(",").slice(0, 2).map((c) => (
                    <span key={c} className="rounded-full border border-agri-500/20 bg-agri-500/10 px-1.5 py-0.5 text-xs text-agri-300">{c}</span>
                  ))}
                </div>
              </td>
              <td className="px-4 py-3 text-white/60">{formatArea(f.account.areaM2)}</td>
              <td className="px-4 py-3">
                <span className="rounded-full border border-agri-500/20 bg-agri-500/10 px-2 py-0.5 text-xs font-semibold text-agri-300">
                  {f.account.evidenceCount}
                </span>
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-xs text-white/40">{formatDate(f.account.createdAt, locale)}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <Link href={`/farm/${f.account.owner.toBase58()}?farmId=${f.account.farmId}`}
                    className="text-xs text-agri-400 hover:underline">{t("admin.view")}</Link>
                  <a href={explorerAccountUrl(f.publicKey.toBase58())} target="_blank" rel="noreferrer"
                    className="text-white/40 hover:text-agri-400">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EvidenceTable({ evidence }: { evidence: EvidenceWithPubkey[] }) {
  const { t, locale } = useTranslation();
  if (!evidence.length) return <EmptyState text={t("admin.emptyEvidence")} />;
  return (
    <div className="overflow-x-auto rounded-3xl border border-white/10">
      <table className="w-full text-sm">
        <thead className="bg-white/[0.04] text-xs uppercase tracking-wide text-white/45">
          <tr>
            {["Type", "Summary", "Qty", "Unit", "Submitted", "Submitter", "On-chain"].map((h) => (
              <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {evidence.map((e) => {
            const typeKey = evidenceTypeFromAnchor(e.account.evidenceType as Record<string, unknown>) as EvidenceTypeKey;
            return (
              <tr key={e.publicKey.toBase58()} className="bg-white/[0.02] transition-colors hover:bg-white/[0.05]">
                <td className="px-4 py-3"><EvidenceBadge type={typeKey} size="sm" /></td>
                <td className="max-w-[220px] truncate px-4 py-3 text-white/70">{e.account.summary}</td>
                <td className="px-4 py-3 font-semibold text-agri-400">{e.account.quantity.toLocaleString()}</td>
                <td className="px-4 py-3 text-xs text-white/50">{e.account.unit}</td>
                <td className="whitespace-nowrap px-4 py-3 text-xs text-white/40">{formatDate(e.account.submittedAt, locale)}</td>
                <td className="px-4 py-3 font-mono text-xs text-white/40">
                  {e.account.submitter.toBase58().slice(0, 8)}...
                </td>
                <td className="px-4 py-3">
                  <a href={explorerAccountUrl(e.publicKey.toBase58())} target="_blank" rel="noreferrer"
                    className="text-white/40 hover:text-agri-400">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-white/40">
      <p className="text-sm">{text}</p>
    </div>
  );
}
