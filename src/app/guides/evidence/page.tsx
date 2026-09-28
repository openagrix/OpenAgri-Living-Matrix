"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Check, Copy, FileJson2 } from "lucide-react";
import { useTranslation } from "@/i18n/LanguageProvider";
import { getEvidenceTemplates } from "@/i18n/evidenceTemplates";
import { EVIDENCE_TYPE_MAP, type EvidenceTypeKey } from "@/types/openagri";
import { cn } from "@/lib/utils";

const TYPE_ORDER: EvidenceTypeKey[] = [
  "Harvest",
  "Soil",
  "Carbon",
  "Water",
  "Biodiversity",
  "HoneyQuality",
  "ProduceQuality",
];

export default function EvidenceGuidePage() {
  const { t, locale, dict } = useTranslation();
  const guide = dict.evidenceGuide;
  const [mode, setMode] = useState<"base" | "agarwood">("base");
  const [active, setActive] = useState<EvidenceTypeKey>("Harvest");
  const [copied, setCopied] = useState(false);

  const templates = useMemo(
    () => getEvidenceTemplates(locale, mode === "agarwood" ? "agarwood" : ""),
    [locale, mode]
  );

  const tpl = templates[active];
  const meta = EVIDENCE_TYPE_MAP[active];
  const typeCopy = guide.types[active];

  const copyJson = async () => {
    try {
      await navigator.clipboard.writeText(tpl.placeholderData);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="mb-10 max-w-3xl">
        <p className="section-eyebrow">{t("evidenceGuide.eyebrow")}</p>
        <h1 className="mb-3 text-3xl font-extrabold text-white sm:text-4xl">
          {t("evidenceGuide.title")}
        </h1>
        <p className="text-base leading-relaxed text-white/55">
          {t("evidenceGuide.subtitle")}
        </p>
      </div>

      <div className="mb-10 grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="mb-4 text-sm font-bold text-white">
            {t("evidenceGuide.stepsTitle")}
          </h2>
          <ol className="space-y-3">
            {guide.steps.map((step, i) => (
              <li key={i} className="flex gap-3 text-sm leading-relaxed text-white/65">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-agri-500/15 text-xs font-bold text-agri-300">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="mb-4 text-sm font-bold text-white">
            {t("evidenceGuide.tipsTitle")}
          </h2>
          <ul className="space-y-3">
            {guide.tips.map((tip) => (
              <li key={tip} className="flex gap-2.5 text-sm leading-relaxed text-white/65">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-agri-400" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">{t("evidenceGuide.samplesTitle")}</h2>
          <p className="mt-1 text-sm text-white/45">{t("evidenceGuide.samplesSubtitle")}</p>
        </div>
        <div className="inline-flex rounded-full border border-white/10 bg-white/[0.03] p-1">
          {(["base", "agarwood"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
                mode === m
                  ? "bg-agri-500/20 text-agri-300"
                  : "text-white/45 hover:text-white/70"
              )}
            >
              {m === "base"
                ? t("evidenceGuide.modeBase")
                : t("evidenceGuide.modeAgarwood")}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {TYPE_ORDER.map((type) => {
          const info = EVIDENCE_TYPE_MAP[type];
          return (
            <button
              key={type}
              type="button"
              onClick={() => setActive(type)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                active === type
                  ? "border-agri-500/40 bg-agri-500/15 text-agri-200"
                  : "border-white/10 bg-white/[0.03] text-white/55 hover:border-white/20 hover:text-white/80"
              )}
            >
              <span>{info.icon}</span>
              {locale === "en" ? info.label : info.labelVi}
            </button>
          );
        })}
      </div>

      <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <span className="text-2xl">{meta.icon}</span>
              <h3 className="text-lg font-bold text-white">
                {locale === "en" ? meta.label : meta.labelVi}
              </h3>
            </div>
            <p className="max-w-2xl text-sm leading-relaxed text-white/50">
              {typeCopy.about}
            </p>
          </div>
          <FileJson2 className="h-5 w-5 text-white/25" />
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-forest-950/40 p-4">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-white/35">
              {t("evidenceGuide.summaryLabel")}
            </p>
            <p className="text-sm text-white/75">{tpl.placeholderSummary}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-forest-950/40 p-4">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-white/35">
              {t("evidenceGuide.quantityLabel")}
            </p>
            <p className="text-sm text-white/75">
              {tpl.quantityLabel} · unit: <span className="font-mono text-agri-300">{tpl.unit}</span>
            </p>
          </div>
        </div>

        <div className="mb-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/40">
            {t("evidenceGuide.fieldsTitle")}
          </p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {typeCopy.fields.map((f) => (
              <li
                key={f}
                className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 font-mono text-xs text-white/55"
              >
                {f}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/40">
              {t("evidenceGuide.jsonLabel")}
            </p>
            <button
              type="button"
              onClick={copyJson}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/70 hover:bg-white/10 hover:text-white"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-agri-400" />
                  {t("evidenceGuide.copied")}
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  {t("evidenceGuide.copy")}
                </>
              )}
            </button>
          </div>
          <pre className="overflow-x-auto rounded-2xl border border-white/10 bg-forest-950 p-4 font-mono text-xs leading-relaxed text-agri-200/90">
            {tpl.placeholderData}
          </pre>
        </div>
      </section>

      <div className="mt-12 rounded-3xl border border-agri-500/20 bg-agri-500/10 px-6 py-8 text-center">
        <p className="mb-4 text-lg font-semibold text-white">{t("evidenceGuide.ctaTitle")}</p>
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/farm/register" className="btn-primary">
            {t("evidenceGuide.ctaRegister")}
          </Link>
          <Link href="/explore" className="btn-ghost">
            {t("evidenceGuide.ctaSubmit")}
          </Link>
        </div>
      </div>
    </div>
  );
}
