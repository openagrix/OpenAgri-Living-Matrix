"use client";

import { ExternalLink } from "lucide-react";
import { EvidenceBadge } from "./EvidenceBadge";
import { formatDate, evidenceTypeFromAnchor } from "@/lib/utils";
import { toHex } from "@/lib/hash";
import { explorerAccountUrl } from "@/lib/constants";
import { useTranslation } from "@/i18n/LanguageProvider";
import type { EvidenceWithPubkey, EvidenceTypeKey } from "@/types/openagri";

interface EvidenceCardProps {
  evidence: EvidenceWithPubkey;
}

export function EvidenceCard({ evidence }: EvidenceCardProps) {
  const { t, locale } = useTranslation();
  const { account, publicKey } = evidence;
  const typeKey = evidenceTypeFromAnchor(account.evidenceType as Record<string, unknown>) as EvidenceTypeKey;
  const hashHex = toHex(new Uint8Array(account.dataHash)).slice(0, 16) + "...";

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 transition-colors hover:border-agri-500/30 hover:bg-white/[0.05]">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white/40">#{account.sequence}</span>
          <EvidenceBadge type={typeKey} size="sm" />
        </div>
        <a
          href={explorerAccountUrl(publicKey.toBase58())}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 text-xs text-agri-400 transition-colors hover:text-agri-300"
          title={t("evidenceCard.verify")}
        >
          {t("evidenceCard.verify")}
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      <p className="mb-3 text-sm font-medium text-white/85">{account.summary}</p>

      <div className="mb-3 flex items-center gap-1.5">
        <span className="text-2xl font-bold text-agri-400">
          {account.quantity.toLocaleString()}
        </span>
        <span className="text-sm text-white/45">{account.unit}</span>
      </div>

      <div className="space-y-1 border-t border-white/10 pt-3 text-xs text-white/35">
        <div className="flex items-center justify-between">
          <span>{t("evidenceCard.dataHash")}</span>
          <code className="font-mono text-white/50">{hashHex}</code>
        </div>
        <div className="flex items-center justify-between">
          <span>{t("evidenceCard.eventDate")}</span>
          <span>{formatDate(account.eventTimestamp, locale)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>{t("evidenceCard.submitted")}</span>
          <span>{formatDate(account.submittedAt, locale)}</span>
        </div>
      </div>
    </div>
  );
}
