"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PublicKey } from "@solana/web3.js";
import { CheckCircle, ExternalLink, Loader2, XCircle } from "lucide-react";
import { getReadonlyProgram } from "@/lib/anchor";
import { evidenceTypeFromAnchor, formatDate } from "@/lib/utils";
import { toHex, verifyEvidenceJson } from "@/lib/hash";
import { explorerAccountUrl, ONG_DU_LOCKED_HASH, SOLANA_NETWORK } from "@/lib/constants";
import { EvidenceBadge } from "@/components/EvidenceBadge";
import { EvidenceHashChecker } from "@/components/EvidenceHashChecker";
import type { EvidenceTypeKey } from "@/types/openagri";
import { useTranslation } from "@/i18n/LanguageProvider";

export default function VerifyPage() {
  const params = useParams();
  const accountAddr = params.txSig as string; // actually an account address
  const { t, locale } = useTranslation();

  const [record, setRecord] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accountAddr) return;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        // Read-only: a buyer must be able to verify without a wallet
        const program = getReadonlyProgram();
        const pk = new PublicKey(accountAddr);
        const ev = await (program.account as any).evidenceRecord.fetch(pk); // any cast needed with placeholder IDL
        setRecord({
          ...ev,
          quantity: (ev.quantity as { toNumber(): number }).toNumber(),
          eventTimestamp: (ev.eventTimestamp as { toNumber(): number }).toNumber(),
          submittedAt: (ev.submittedAt as { toNumber(): number }).toNumber(),
        });
      } catch (e) {
        setError(t("verify.notFoundError"));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [accountAddr, t]);

  const typeKey = record
    ? (evidenceTypeFromAnchor(record.evidenceType) as EvidenceTypeKey)
    : "Harvest";

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <div className="mb-8 text-center">
        <p className="section-eyebrow justify-center">Verify</p>
        <h1 className="text-2xl font-extrabold text-white">{t("verify.title")}</h1>
        <p className="mt-2 text-sm text-white/50">
          {t("verify.subtitle")}
        </p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-agri-400" />
          <span className="ml-3 text-white/50">{t("verify.loading")}</span>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 rounded-3xl border border-red-500/30 bg-red-500/10 p-5">
          <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
          <div>
            <p className="font-medium text-red-300">{t("verify.notFoundTitle")}</p>
            <p className="mt-1 text-sm text-red-300/80">{error}</p>
          </div>
        </div>
      )}

      {record && !loading && (
        <div className="space-y-4">
          {/* Verified header */}
          <div className="flex items-center gap-3 rounded-3xl border border-agri-500/30 bg-agri-500/10 p-4">
            <CheckCircle className="h-8 w-8 shrink-0 text-agri-400" />
            <div>
              <p className="font-bold text-agri-300">Evidence Verified</p>
              <p className="text-sm text-agri-400/80">
                {t("verify.immutable", { network: SOLANA_NETWORK })}
              </p>
              <p className="mt-1 text-xs font-semibold text-agri-300">
                {toHex(new Uint8Array(record.dataHash)) === ONG_DU_LOCKED_HASH
                  ? t("ongDuCre.creBadgePass")
                  : t("ongDuCre.creBadgeSelf")}
              </p>
            </div>
          </div>

          {/* Record details */}
          <div className="space-y-4 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <div className="flex items-center justify-between">
              <EvidenceBadge type={typeKey} />
              <span className="text-sm text-white/40">Sequence #{record.sequence}</span>
            </div>

            <p className="text-lg font-semibold text-white">{record.summary}</p>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-agri-400">
                {record.quantity.toLocaleString()}
              </span>
              <span className="text-white/50">{record.unit}</span>
            </div>

            <div className="divide-y divide-white/10 text-sm">
              {[
                { label: t("verify.eventDate"), value: formatDate(record.eventTimestamp, locale) },
                { label: t("verify.submittedAt"), value: formatDate(record.submittedAt, locale) },
                {
                  label: "Farm account",
                  value: `${record.farm.toBase58().slice(0, 12)}...`,
                  href: explorerAccountUrl(record.farm.toBase58()),
                },
                {
                  label: t("verify.submitter"),
                  value: `${record.submitter.toBase58().slice(0, 12)}...`,
                },
                {
                  label: `${t("verify.dataHash")} (SHA-256)`,
                  value: toHex(new Uint8Array(record.dataHash)),
                  mono: true,
                  truncate: true,
                },
              ].map((row) => (
                <div key={row.label} className="flex items-start justify-between gap-3 py-2.5">
                  <span className="shrink-0 text-white/45">{row.label}</span>
                  {row.href ? (
                    <a
                      href={row.href}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 font-medium text-agri-400 hover:text-agri-300"
                    >
                      {row.value}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <span
                      className={`text-right text-white ${
                        row.mono ? "break-all font-mono text-xs" : "font-medium"
                      } ${row.truncate ? "max-w-[200px] truncate" : ""}`}
                    >
                      {row.value}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <EvidenceHashChecker onChainHash={Array.from(record.dataHash as number[])} />

          <a
            href={explorerAccountUrl(accountAddr)}
            target="_blank"
            rel="noreferrer"
            className="btn-ghost w-full justify-center"
          >
            <ExternalLink className="h-4 w-4" />
            {t("verify.openExplorer")}
          </a>
        </div>
      )}
    </div>
  );
}
