"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle, Shield, Leaf } from "lucide-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useRole } from "@/hooks/useRole";
import { useFarm } from "@/hooks/useFarm";
import { FarmCarousel } from "@/components/FarmCarousel";
import { useTranslation } from "@/i18n/LanguageProvider";
import type { FarmWithPubkey } from "@/types/openagri";

const EVIDENCE_ICONS = ["🌾", "🌍", "🌎", "🐝", "🍯", "🍎"] as const;
const EVIDENCE_KEYS = [
  "harvest",
  "soil",
  "carbon",
  "biodiversity",
  "honey",
  "produce",
] as const;
const BENEFIT_KEYS = [
  "immutable",
  "global",
  "premium",
  "chain",
  "cost",
  "ownership",
] as const;

export default function HomePage() {
  const { walletAddress, isAdmin, isMember } = useRole();
  const { fetchAllFarms } = useFarm();
  const { t, dict } = useTranslation();
  const [farms, setFarms] = useState<FarmWithPubkey[]>([]);
  const [farmsLoading, setFarmsLoading] = useState(true);

  const loadFarms = useCallback(async () => {
    setFarmsLoading(true);
    const data = await fetchAllFarms();
    setFarms(data);
    setFarmsLoading(false);
  }, [fetchAllFarms]);

  useEffect(() => {
    loadFarms();
    const onFocus = () => loadFarms();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [loadFarms]);

  const evidenceTypes = EVIDENCE_KEYS.map((key, i) => ({
    icon: EVIDENCE_ICONS[i],
    title: t(`home.evidenceTypes.${key}.title`),
    desc: t(`home.evidenceTypes.${key}.desc`),
  }));

  const benefits = BENEFIT_KEYS.map((key) => ({
    title: t(`home.benefits.${key}.title`),
    desc: t(`home.benefits.${key}.desc`),
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      <section className="pb-16 pt-6 sm:pb-20 sm:pt-10">
        <div className="mb-8 animate-fade-up text-center">
          <p className="mb-4 text-sm font-semibold tracking-wide text-agri-400">
            {t("home.brand")}
          </p>
          <h1 className="mx-auto mb-4 max-w-3xl text-4xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl">
            {t("home.heroTitle1")}{" "}
            <span className="text-agri-400">{t("home.heroTitle2")}</span>
          </h1>
          <p className="mx-auto mb-8 max-w-xl text-base text-white/60 sm:text-lg">
            {t("home.heroDesc")}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 animate-fade-up-delay">
            {walletAddress ? (
              <Link href={`/farm/${walletAddress}`} className="btn-primary">
                {isAdmin ? t("home.ctaAdmin") : t("home.ctaMyFarm")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <WalletMultiButton />
            )}
            <Link href="/farm/register" className="btn-secondary">
              <Leaf className="h-4 w-4" />
              {t("home.ctaRegister")}
            </Link>
            <Link href="/explore" className="btn-ghost">
              {t("home.ctaExplore")}
            </Link>
          </div>
        </div>

        <div className="relative animate-fade-up-delay-2 overflow-hidden rounded-[2rem] border border-agri-500/25 shadow-glow sm:rounded-[2.5rem]">
          <div className="hero-field absolute inset-0" />
          <div className="absolute inset-0 bg-gradient-to-t from-forest-950/90 via-forest-950/40 to-transparent" />
          <div
            className="pointer-events-none absolute -right-20 top-1/4 h-64 w-64 animate-soft-pulse rounded-full bg-agri-500/20 blur-3xl"
            aria-hidden
          />
          <div className="relative flex min-h-[320px] flex-col items-center justify-center px-6 py-16 text-center sm:min-h-[380px] sm:px-12 sm:py-20">
            <blockquote className="mx-auto max-w-2xl text-2xl font-bold leading-snug tracking-tight text-white sm:text-3xl lg:text-4xl">
              &ldquo;{t("home.quote")}&rdquo;
            </blockquote>
            <div className="mt-8 flex items-center gap-2 text-sm font-medium text-white/70">
              <Leaf className="h-4 w-4 text-agri-400" />
              {t("home.quoteMeta")}
            </div>
          </div>
        </div>
      </section>

      <section className="mb-16 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {[
          { value: "100%", label: t("home.statImmutable") },
          { value: "400ms", label: t("home.statSpeed") },
          { value: "7", label: t("home.statEvidenceTypes") },
          {
            value: farmsLoading ? "…" : String(farms.length),
            label: t("home.statFarms"),
          },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-3xl border border-white/10 bg-white/[0.03] px-4 py-5 text-center"
          >
            <div className="text-2xl font-extrabold text-agri-400 sm:text-3xl">{s.value}</div>
            <div className="mt-1 text-xs text-white/45">{s.label}</div>
          </div>
        ))}
      </section>

      {isAdmin && (
        <section className="mb-12 rounded-3xl border border-red-400/25 bg-red-500/10 px-6 py-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-red-400" />
              <div>
                <p className="font-semibold text-red-200">{t("home.adminBannerTitle")}</p>
                <p className="text-sm text-red-300/70">{t("home.adminBannerDesc")}</p>
              </div>
            </div>
            <Link
              href="/admin"
              className="rounded-full bg-red-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-400"
            >
              {t("home.adminBannerCta")}
            </Link>
          </div>
        </section>
      )}

      {isMember && !isAdmin && walletAddress && (
        <section className="mb-12 rounded-3xl border border-agri-500/25 bg-agri-500/10 px-6 py-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Leaf className="h-6 w-6 text-agri-400" />
              <div>
                <p className="font-semibold text-agri-200">{t("home.memberBannerTitle")}</p>
                <p className="text-sm text-agri-300/70">{t("home.memberBannerDesc")}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href={`/farm/${walletAddress}`} className="btn-ghost !py-2 !text-xs">
                {t("home.ctaMyFarm")}
              </Link>
              <Link href="/farm/register" className="btn-primary !py-2 !text-xs">
                + {t("home.ctaRegister")}
              </Link>
            </div>
          </div>
        </section>
      )}

      <section className="mb-20 grid gap-5 md:grid-cols-2">
        <div className="rounded-3xl border border-red-400/20 bg-red-500/[0.07] p-7 sm:p-8">
          <p className="section-eyebrow !text-red-400">{t("home.problemEyebrow")}</p>
          <h2 className="mb-5 text-xl font-bold text-white">{t("home.problemTitle")}</h2>
          <ul className="space-y-3 text-sm text-white/60">
            {dict.home.problems.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-red-400" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-3xl border border-agri-500/25 bg-agri-500/[0.07] p-7 sm:p-8">
          <p className="section-eyebrow">{t("home.solutionEyebrow")}</p>
          <h2 className="mb-5 text-xl font-bold text-white">{t("home.solutionTitle")}</h2>
          <ul className="space-y-3 text-sm text-white/70">
            {dict.home.solutions.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-agri-400" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mb-20">
        <div className="mb-10 text-center">
          <p className="section-eyebrow">{t("home.evidenceEyebrow")}</p>
          <h2 className="mb-2 text-3xl font-extrabold tracking-tight text-white">
            {t("home.evidenceTitle")}
          </h2>
          <p className="text-sm text-white/45">{t("home.evidenceSubtitle")}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {evidenceTypes.map((item) => (
            <div
              key={item.title}
              className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 transition-colors hover:border-agri-500/30 hover:bg-white/[0.05]"
            >
              <div className="mb-4 text-3xl">{item.icon}</div>
              <h3 className="mb-2 font-semibold text-white">{item.title}</h3>
              <p className="text-sm leading-relaxed text-white/45">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-20">
        <div className="mb-10 text-center">
          <p className="section-eyebrow">{t("home.whyEyebrow")}</p>
          <h2 className="mb-2 text-3xl font-extrabold tracking-tight text-white">
            {t("home.whyTitle")}
          </h2>
          <p className="mx-auto max-w-lg text-sm text-white/45">{t("home.whySubtitle")}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((b, i) => (
            <div
              key={b.title}
              className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 transition-colors hover:border-agri-500/30"
            >
              <span className="mb-3 block font-mono text-xs text-agri-500/60">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mb-2 font-bold text-white">{b.title}</h3>
              <p className="text-sm leading-relaxed text-white/45">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-20">
        <div className="mb-10 flex flex-col items-center text-center sm:flex-row sm:items-end sm:justify-between sm:text-left">
          <div>
            <p className="section-eyebrow">{t("home.farmsEyebrow")}</p>
            <h2 className="mb-2 text-3xl font-extrabold tracking-tight text-white">
              {t("home.farmsTitle")}
            </h2>
            <p className="text-sm text-white/45">
              {farmsLoading
                ? t("home.farmsLoading")
                : `${farms.length} ${t("home.farmsSynced")}`}
            </p>
          </div>
          <Link href="/explore" className="btn-ghost mt-4 !py-2 !text-xs sm:mt-0">
            {t("home.farmsCta")}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <FarmCarousel farms={farms} loading={farmsLoading} />
      </section>

      <section className="mb-24 overflow-hidden rounded-[2rem] border border-agri-500/25 bg-gradient-to-br from-agri-500/15 via-forest-800/80 to-forest-900 px-8 py-14 text-center shadow-glow sm:rounded-[2.5rem] sm:px-12">
        <h2 className="mb-3 text-3xl font-extrabold tracking-tight text-white">
          {t("home.ctaTitle")}
        </h2>
        <p className="mx-auto mb-8 max-w-md text-white/55">{t("home.ctaDesc")}</p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/farm/register" className="btn-primary">
            <Leaf className="h-4 w-4" /> {t("home.ctaRegisterFarm")}
          </Link>
          <Link href="/explore" className="btn-ghost">
            {t("home.ctaExploreFarms")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
