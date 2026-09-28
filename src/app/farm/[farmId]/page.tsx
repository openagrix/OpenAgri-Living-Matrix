"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { PublicKey } from "@solana/web3.js";
import { MapPin, Plus, ExternalLink, Loader2, Shield } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useFarm } from "@/hooks/useFarm";
import { useEvidence } from "@/hooks/useEvidence";
import { useRole } from "@/hooks/useRole";
import { EvidenceCard } from "@/components/EvidenceCard";
import { EvidenceGrid } from "@/components/EvidenceGrid";
import { CarbonMeter } from "@/components/CarbonMeter";
import { QRShareCard } from "@/components/QRShareCard";
import { SubscriptionCard } from "@/components/SubscriptionCard";
import { cropLabel, formatDate, formatArea } from "@/lib/utils";
import { explorerAccountUrl } from "@/lib/constants";
import { useTranslation } from "@/i18n/LanguageProvider";
import type { FarmWithPubkey, EvidenceWithPubkey } from "@/types/openagri";

export default function FarmDashboardPage() {
  const { t, locale } = useTranslation();
  const params = useParams();
  const searchParams = useSearchParams();
  const ownerStr = params.farmId as string;
  const requestedFarmId = searchParams.get("farmId");

  const { publicKey } = useWallet();
  const { fetchFarmsByOwner } = useFarm();
  const { fetchEvidenceForFarm } = useEvidence();
  const { isAdmin } = useRole();

  const [allFarms, setAllFarms] = useState<FarmWithPubkey[]>([]);
  const [activeFarm, setActiveFarm] = useState<FarmWithPubkey | null>(null);
  const [evidence, setEvidence] = useState<EvidenceWithPubkey[]>([]);
  const [loading, setLoading] = useState(true);
  const [evidenceLoading, setEvidenceLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOwner = publicKey?.toBase58() === ownerStr || isAdmin;

  // Load all farms for this owner
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const ownerKey = new PublicKey(ownerStr);
        const farms = await fetchFarmsByOwner(ownerKey);
        setAllFarms(farms);

        // Select: requested farmId, or first farm
        const target = requestedFarmId
          ? farms.find((f) => f.account.farmId === requestedFarmId) ?? farms[0]
          : farms[0];
        setActiveFarm(target ?? null);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [ownerStr]);

  // Load evidence for active farm
  useEffect(() => {
    if (!activeFarm) return;
    const loadEvidence = async () => {
      setEvidenceLoading(true);
      const ev = await fetchEvidenceForFarm(activeFarm.publicKey);
      setEvidence(ev);
      setEvidenceLoading(false);
    };
    loadEvidence();
  }, [activeFarm?.publicKey.toBase58()]);

  // ─── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-agri-400" />
      </div>
    );
  }

  // ─── No farms found ────────────────────────────────────────────────────────
  if (!loading && allFarms.length === 0) {
    if (error && !error.includes("Account does not exist") && !error.includes("not found")) {
      return (
        <div className="mx-auto max-w-lg py-20 text-center">
          <p className="mb-6 break-all rounded-3xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{error}</p>
          <button onClick={() => window.location.reload()}
            className="btn-primary">
            {t("farmDash.retry")}
          </button>
        </div>
      );
    }
    return (
      <div className="mx-auto max-w-lg py-20 text-center">
        <p className="section-eyebrow justify-center">Farm</p>
        <h2 className="mb-2 text-xl font-bold text-white">{t("farmDash.emptyTitle")}</h2>
        <p className="mb-6 text-white/50">
          {isOwner ? t("farmDash.emptyOwner") : t("farmDash.emptyVisitor")}
        </p>
        <Link href="/farm/register" className="btn-primary">
          <Plus className="h-4 w-4" /> {t("farmDash.registerCta")}
        </Link>
      </div>
    );
  }

  const account = activeFarm?.account;
  if (!account) return null;

  const crops = account.cropTypes.split(",").filter(Boolean);
  const carbonTotal = evidence
    .filter((e) => "carbon" in (e.account.evidenceType as Record<string, unknown>))
    .reduce((s, e) => s + e.account.quantity, 0);
  const harvestTotal = evidence
    .filter((e) => "harvest" in (e.account.evidenceType as Record<string, unknown>))
    .reduce((s, e) => s + e.account.quantity, 0);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">

      {/* Admin viewing notice */}
      {isAdmin && publicKey?.toBase58() !== ownerStr && (
        <div className="mb-4 flex items-center gap-2 rounded-3xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
          <Shield className="h-4 w-4 shrink-0" />
          <span>{t("farmDash.adminViewNotice")}</span>
          <Link href="/admin" className="ml-auto text-xs underline hover:text-red-200">→ Admin Dashboard</Link>
        </div>
      )}

      {/* ── Farm selector (if multiple) ────────────────────────────────────── */}
      {allFarms.length > 1 && (
        <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-2">
          <span className="mr-1 shrink-0 text-sm text-white/50">{t("farmDash.selectorLabel")}</span>
          {allFarms.map((f) => (
            <button
              key={f.account.farmId}
              onClick={() => setActiveFarm(f)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                f.account.farmId === account.farmId
                  ? "bg-agri-500 text-forest-950"
                  : "border border-white/10 bg-white/[0.03] text-white/70 hover:border-agri-500/30"
              }`}
            >
              {f.account.name}
            </button>
          ))}
          {isOwner && (
            <Link href="/farm/register"
              className="flex shrink-0 items-center gap-1 rounded-full border border-dashed border-agri-500/30 px-4 py-2 text-sm text-agri-400 transition-colors hover:bg-agri-500/10">
              <Plus className="h-3.5 w-3.5" /> {t("farmDash.addFarm")}
            </Link>
          )}
        </div>
      )}

      {/* ── Farm header ─────────────────────────────────────────────────────── */}
      <div className="mb-6 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2">
              <h1 className="truncate text-2xl font-bold text-white">{account.name}</h1>
              <span className="shrink-0 rounded-full border border-agri-500/20 bg-agri-500/10 px-2 py-0.5 font-mono text-xs text-agri-300">
                #{account.farmId}
              </span>
            </div>
            <div className="mb-3 flex items-center gap-1.5 text-sm text-white/50">
              <MapPin className="h-4 w-4 shrink-0" />
              {account.location}
            </div>
            <div className="flex flex-wrap gap-2">
              {crops.map((c) => (
                <span key={c} className="rounded-full border border-agri-500/20 bg-agri-500/10 px-3 py-1 text-sm text-agri-300">{cropLabel(c, locale)}</span>
              ))}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <a
              href={explorerAccountUrl(activeFarm!.publicKey.toBase58())}
              target="_blank" rel="noreferrer"
              className="btn-ghost !px-4 !py-2 text-sm">
              <ExternalLink className="h-3.5 w-3.5" /> On-chain
            </a>
            {isOwner && (
              <Link
                href={`/farm/${ownerStr}/evidence/new?farmId=${account.farmId}`}
                className="btn-primary !px-4 !py-2 text-sm">
                <Plus className="h-4 w-4" /> {t("farmDash.submitEvidence")}
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ── Stats ────────────────────────────────────────────────────────────── */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: t("farmDash.evidence"), value: account.evidenceCount.toString() },
          { label: t("farmDash.area"), value: formatArea(account.areaM2) },
          { label: t("farmDash.harvest"), value: `${(harvestTotal / 1000).toFixed(1)}t` },
          { label: t("farmDash.carbon"), value: `${carbonTotal.toLocaleString()} kg` },
        ].map((s) => (
          <div key={s.label} className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 text-center">
            <div className="text-xl font-bold text-agri-400">{s.value}</div>
            <div className="mt-0.5 text-xs text-white/45">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Carbon meter + QR ────────────────────────────────────────────────── */}
      {carbonTotal > 0 && (
        <div className="mb-6">
          <CarbonMeter kgCO2={carbonTotal} />
        </div>
      )}
      {isOwner && activeFarm && (
        <div className="mb-6">
          <QRShareCard
            ownerAddress={ownerStr}
            farmName={account.name}
            farmId={account.farmId}
          />
        </div>
      )}

      {/* ── Subscription ─────────────────────────────────────────────────────── */}
      {isOwner && !isAdmin && (
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">{t("farmDash.subscriptionTitle")}</h2>
            <a href="/pricing" className="text-xs text-agri-400 hover:underline">
              {t("farmDash.viewAllPlans")}
            </a>
          </div>
          <SubscriptionCard
            walletAddress={ownerStr}
            farmCount={allFarms.length}
            compact
          />
        </div>
      )}

      {/* ── Evidence ─────────────────────────────────────────────────────────── */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">{t("farmDash.evidenceHistory")}</h2>
          <span className="text-sm text-white/40">{evidence.length} {t("farm.records")}</span>
        </div>

        {evidenceLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-agri-400" />
          </div>
        ) : evidence.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/15 bg-white/[0.02] p-12 text-center">
            <p className="mb-4 text-white/50">{t("farmDash.noEvidence")}</p>
            {isOwner && (
              <Link href={`/farm/${ownerStr}/evidence/new?farmId=${account.farmId}`}
                className="btn-primary">
                <Plus className="h-4 w-4" /> {t("farmDash.firstEvidence")}
              </Link>
            )}
          </div>
        ) : (
          <EvidenceGrid count={evidence.length}>
            {evidence.map((ev) => (
              <EvidenceCard key={ev.publicKey.toBase58()} evidence={ev} />
            ))}
          </EvidenceGrid>
        )}
      </div>

      {/* ── Metadata ─────────────────────────────────────────────────────────── */}
      <div className="mt-8 flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/40">
        <span>Farm ID: <code>{account.farmId}</code></span>
        <span>Owner: <code>{ownerStr.slice(0, 8)}...{ownerStr.slice(-6)}</code></span>
        <span>{t("farmDash.registered", { date: formatDate(account.createdAt, locale) })}</span>
        {allFarms.length > 1 && <span>{t("farmDash.farmCount", { n: allFarms.length })}</span>}
      </div>
    </div>
  );
}
