"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { EvidenceHashChecker } from "@/components/EvidenceHashChecker";
import { useTranslation } from "@/i18n/LanguageProvider";
import {
  ONG_DU_REGION_CODE,
  ONG_DU_STABLE_REPORT,
  evaluateHoney,
  DEMO_HONEY_POLICY,
} from "@/lib/cre/ongDuHoney";
import { hashEvidenceData } from "@/lib/hash";
import {
  CRE_DOCS_RECEIVER_PROGRAM_ID,
  explorerAccountUrl,
  explorerTxUrl,
  ONG_DU_ATTESTATION_TX,
  ONG_DU_LOCKED_HASH,
} from "@/lib/constants";

export default function OngDuCrePage() {
  const { t, dict } = useTranslation();
  const copy = dict.ongDuCre;
  const [hashBytes, setHashBytes] = useState<number[] | null>(null);
  const [hashHex, setHashHex] = useState<string>("");
  const [demoJson, setDemoJson] = useState("");

  const scored = evaluateHoney(ONG_DU_STABLE_REPORT.assay, DEMO_HONEY_POLICY);

  useEffect(() => {
    void hashEvidenceData(ONG_DU_STABLE_REPORT).then((digest) => {
      setHashBytes(Array.from(digest));
      setHashHex(Array.from(digest).map((b) => b.toString(16).padStart(2, "0")).join(""));
    });
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="mb-10 max-w-3xl">
        <p className="section-eyebrow">{t("ongDuCre.eyebrow")}</p>
        <h1 className="mb-3 text-3xl font-extrabold text-white sm:text-4xl">
          {t("ongDuCre.title")}
        </h1>
        <p className="text-base leading-relaxed text-white/55">
          {t("ongDuCre.subtitle")}
        </p>
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl border border-agri-500/20 bg-agri-500/5 p-6">
          <h2 className="mb-4 text-sm font-bold text-white">{t("ongDuCre.publicTitle")}</h2>
          <dl className="space-y-2 text-sm text-white/70">
            <div className="flex justify-between gap-4">
              <dt>{t("ongDuCre.lot")}</dt>
              <dd className="font-mono text-white">{ONG_DU_STABLE_REPORT.assay.lot_id}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>{t("ongDuCre.verdict")}</dt>
              <dd className="font-semibold text-agri-300">{scored.verdict}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>{t("ongDuCre.grade")}</dt>
              <dd className="text-white">{scored.grade}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>{t("ongDuCre.region")}</dt>
              <dd className="font-mono text-white">{ONG_DU_REGION_CODE}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>{t("ongDuCre.chain")}</dt>
              <dd className="text-white">Solana Devnet</dd>
            </div>
            <div>
              <dt className="mb-1">{t("ongDuCre.receiver")}</dt>
              <dd>
                <a
                  href={explorerAccountUrl(CRE_DOCS_RECEIVER_PROGRAM_ID.toBase58())}
                  target="_blank"
                  rel="noreferrer"
                  className="break-all font-mono text-xs text-agri-300 hover:underline"
                >
                  {CRE_DOCS_RECEIVER_PROGRAM_ID.toBase58()}
                </a>
              </dd>
            </div>
            <div>
              <dt className="mb-1">{t("ongDuCre.hash")}</dt>
              <dd className="break-all font-mono text-xs text-agri-300/90">
                {hashHex || "…"}
              </dd>
            </div>
          </dl>
          <p className="mt-4 text-xs leading-relaxed text-white/40">{t("ongDuCre.publicNote")}</p>
          {hashHex === ONG_DU_LOCKED_HASH && (
            <p className="mt-3 rounded-2xl border border-agri-500/30 bg-agri-500/10 px-3 py-2 text-xs font-semibold text-agri-300">
              {t("ongDuCre.creBadgePass")}
            </p>
          )}
          <a
            href={explorerTxUrl(ONG_DU_ATTESTATION_TX)}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-block break-all font-mono text-xs text-agri-300 hover:underline"
          >
            {ONG_DU_ATTESTATION_TX}
          </a>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="mb-4 text-sm font-bold text-white">
            {t("ongDuCre.confidentialTitle")}
          </h2>
          <ul className="space-y-2 text-sm text-white/65">
            {copy.confidentialItems.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-agri-400">▸</span>
                {item}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="mb-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="mb-4 text-sm font-bold text-white">{t("ongDuCre.howTitle")}</h2>
        <ol className="space-y-3">
          {copy.steps.map((step, i) => (
            <li key={i} className="flex gap-3 text-sm leading-relaxed text-white/65">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-agri-500/15 text-xs font-bold text-agri-300">
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-sm text-white/45">
          <Link href="/guides/evidence" className="text-agri-300 hover:underline">
            {t("footer.evidenceGuide")}
          </Link>
        </p>
      </section>

      {hashBytes && (
        <div className="space-y-3">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setDemoJson(JSON.stringify(ONG_DU_STABLE_REPORT, null, 2))}
          >
            {t("ongDuCre.loadDemo")}
          </button>
          <p className="text-xs text-white/40">{t("ongDuCre.demoPii")}</p>
          {demoJson && (
            <textarea
              readOnly
              rows={8}
              value={demoJson}
              className="field-input resize-y font-mono text-xs"
            />
          )}
          <EvidenceHashChecker onChainHash={hashBytes} />
        </div>
      )}
    </div>
  );
}
