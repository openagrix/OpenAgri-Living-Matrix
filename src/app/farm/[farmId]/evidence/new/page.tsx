"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { CheckCircle, Loader2 } from "lucide-react";
import { useEvidence } from "@/hooks/useEvidence";
import { useFarm } from "@/hooks/useFarm";
import { useTranslation } from "@/i18n/LanguageProvider";
import {
  getEvidenceTemplates,
  isAgarwoodCropTypes,
  type EvidenceTemplate,
} from "@/i18n/evidenceTemplates";
import { getFarmPDA } from "@/lib/anchor";
import { PublicKey } from "@solana/web3.js";
import { EVIDENCE_TYPE_MAP, type EvidenceTypeKey } from "@/types/openagri";
import { explorerTxUrl } from "@/lib/constants";
import type { SubmitEvidenceForm } from "@/types/openagri";

export default function SubmitEvidencePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { publicKey } = useWallet();
  const { submitEvidence, loading, error } = useEvidence();
  const { fetchFarmByOwnerAndId } = useFarm();
  const { t, locale } = useTranslation();
  const router = useRouter();

  const ownerStr = params.farmId as string;
  const farmId = searchParams.get("farmId") ?? "";
  const isOwner = publicKey?.toBase58() === ownerStr;

  const [farmCropTypesString, setFarmCropTypesString] = useState("");
  const [selectedType, setSelectedType] = useState<EvidenceTypeKey>("Harvest");
  const [form, setForm] = useState<SubmitEvidenceForm>({
    evidenceType: "Harvest",
    summary: "",
    quantity: 0,
    unit: "kg",
    eventDate: new Date().toISOString().split("T")[0],
    rawData: "",
    ipfsCid: "",
  });
  const [txSig, setTxSig] = useState<string | null>(null);
  const previousTemplate = useRef<EvidenceTemplate | null>(null);

  useEffect(() => {
    if (!ownerStr || !farmId) return;
    fetchFarmByOwnerAndId(new PublicKey(ownerStr), farmId)
      .then((farm) => {
        if (farm) setFarmCropTypesString(farm.account.cropTypes);
      })
      .catch(() => {});
  }, [ownerStr, farmId]);

  const templates = getEvidenceTemplates(locale, farmCropTypesString);
  const template = templates[selectedType];
  const isAgarwood = isAgarwoodCropTypes(farmCropTypesString);

  useEffect(() => {
    const previous = previousTemplate.current;
    setForm((current) => ({
      ...current,
      evidenceType: selectedType,
      unit: !previous || current.unit === previous.unit ? template.unit : current.unit,
      summary:
        previous && current.summary === previous.placeholderSummary
          ? template.placeholderSummary
          : current.summary,
      rawData:
        previous && current.rawData === previous.placeholderData
          ? template.placeholderData
          : current.rawData,
    }));
    previousTemplate.current = template;
  }, [selectedType, locale, farmCropTypesString, template]);

  const evidenceTypeLabel = (type: EvidenceTypeKey) =>
    isAgarwood && type === "Harvest"
      ? t("evidenceForm.harvestAgarwood")
      : locale === "en"
        ? EVIDENCE_TYPE_MAP[type].label
        : EVIDENCE_TYPE_MAP[type].labelVi;

  const handleTypeSelect = (type: EvidenceTypeKey) => {
    setSelectedType(type);
    previousTemplate.current = templates[type];
    setForm((current) => ({
      ...current,
      evidenceType: type,
      unit: templates[type].unit,
      rawData: "",
      summary: "",
      quantity: 0,
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!publicKey || !farmId) return;
    const [farmPDA] = getFarmPDA(publicKey, farmId);
    const signature = await submitEvidence(farmPDA, {
      ...form,
      evidenceType: selectedType,
    });
    if (signature) setTxSig(signature);
  };

  if (publicKey && !isOwner) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <h2 className="text-lg font-bold text-white">{t("evidenceForm.noAccess")}</h2>
        <p className="text-sm text-white/50">{t("evidenceForm.ownerOnly")}</p>
        <button onClick={() => router.back()} className="text-sm text-agri-400 hover:underline">
          {t("evidenceForm.back")}
        </button>
      </div>
    );
  }

  if (!publicKey) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-white/60">{t("evidenceForm.connectWallet")}</p>
        <WalletMultiButton />
      </div>
    );
  }

  if (txSig) {
    return (
      <div className="mx-auto max-w-lg py-20 text-center">
        <CheckCircle className="mx-auto mb-4 h-16 w-16 text-agri-400" />
        <h2 className="mb-2 text-2xl font-bold text-white">
          {t("evidenceForm.successTitle")}
        </h2>
        <p className="mb-2 text-white/50">{t("evidenceForm.successBody")}</p>
        <p className="mb-6 text-xs text-white/40">
          {t("evidenceForm.successImmutable")}
        </p>
        <div className="mb-8 break-all rounded-3xl border border-white/10 bg-white/[0.03] p-4 font-mono text-xs text-white/60">
          {txSig}
        </div>
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <a
            href={explorerTxUrl(txSig)}
            target="_blank"
            rel="noreferrer"
            className="btn-ghost"
          >
            {t("evidenceForm.verifyExplorer")}
          </a>
          <button
            onClick={() => router.push(`/farm/${params.farmId}?farmId=${farmId}`)}
            className="btn-primary"
          >
            {t("evidenceForm.backDashboard")}
          </button>
        </div>
      </div>
    );
  }

  const types = Object.keys(EVIDENCE_TYPE_MAP) as EvidenceTypeKey[];
  const scrollTypes = types.length > 5;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-8">
        <p className="section-eyebrow">Evidence</p>
        <h1 className="text-3xl font-extrabold text-white">
          {t("evidenceForm.title")}
        </h1>
        <p className="mt-2 text-white/50">{t("evidenceForm.subtitle")}</p>
        {isAgarwood && (
          <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-sm text-amber-300">
            <span className="font-medium">{t("evidenceForm.agarwoodBadge")}</span>
            <span className="text-amber-400/70">{t("evidenceForm.citesLoaded")}</span>
          </div>
        )}
      </div>

      <div className="mb-6">
        <label className="mb-2 block text-sm font-medium text-white/70">
          {t("evidenceForm.typeLabel")}
        </label>
        {isAgarwood && (
          <div className="mb-3 rounded-3xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-xs text-amber-300">
            {t("evidenceForm.agarwoodHint")}
          </div>
        )}
        <div>
          <div
            className={`flex gap-2 pb-1 ${
              scrollTypes
                ? "overflow-x-auto scroll-smooth snap-x snap-mandatory [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-agri-500/40"
                : ""
            }`}
          >
            {types.map((type) => {
              const meta = EVIDENCE_TYPE_MAP[type];
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleTypeSelect(type)}
                  className={`snap-start rounded-3xl border p-3 text-center text-sm transition-colors ${
                    scrollTypes
                      ? "w-[calc((100%-2.5rem)/5)] min-w-[6.5rem] shrink-0"
                      : "min-w-0 flex-1"
                  } ${
                    selectedType === type
                      ? isAgarwood
                        ? "border-amber-500/40 bg-amber-500/15 font-semibold text-amber-300"
                        : "border-agri-500/40 bg-agri-500/15 font-semibold text-agri-300"
                      : "border-white/10 bg-white/[0.03] text-white/60 hover:border-agri-500/30"
                  }`}
                >
                  <div className="mb-1 text-xl">{meta.icon}</div>
                  <div className="text-xs leading-tight">{evidenceTypeLabel(type)}</div>
                </button>
              );
            })}
          </div>
          {scrollTypes && (
            <p className="mt-2 text-center text-xs text-white/35">
              {t("evidenceForm.swipeHint")}
            </p>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-white/70">
            {t("evidenceForm.summary")} <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            maxLength={200}
            required
            placeholder={template.placeholderSummary}
            value={form.summary}
            onChange={(event) =>
              setForm((current) => ({ ...current, summary: event.target.value }))
            }
            className="field-input"
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-white/70">
              {template.quantityLabel} <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              min={0}
              required
              value={form.quantity || ""}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  quantity: parseInt(event.target.value) || 0,
                }))
              }
              className="field-input"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-white/70">
              {t("evidenceForm.unit")}
            </label>
            <input
              type="text"
              maxLength={10}
              value={form.unit}
              onChange={(event) =>
                setForm((current) => ({ ...current, unit: event.target.value }))
              }
              className="field-input"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-white/70">
            {t("evidenceForm.eventDate")} <span className="text-red-400">*</span>
          </label>
          <input
            type="date"
            required
            value={form.eventDate}
            onChange={(event) =>
              setForm((current) => ({ ...current, eventDate: event.target.value }))
            }
            className="field-input"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-white/70">
            {t("evidenceForm.rawData")}
          </label>
          <textarea
            rows={6}
            placeholder={template.placeholderData}
            value={form.rawData}
            onChange={(event) =>
              setForm((current) => ({ ...current, rawData: event.target.value }))
            }
            className="field-input font-mono text-xs"
          />
          <p className="mt-1 text-xs text-white/40">
            {t("evidenceForm.rawDataHint")}
          </p>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-white/70">
            {t("evidenceForm.cid")}{" "}
            <span className="text-xs font-normal text-white/40">
              {t("evidenceForm.optional")}
            </span>
          </label>
          <input
            type="text"
            maxLength={60}
            placeholder="QmXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
            value={form.ipfsCid}
            onChange={(event) =>
              setForm((current) => ({ ...current, ipfsCid: event.target.value }))
            }
            className="field-input font-mono text-xs"
          />
        </div>

        {error && (
          <div className="rounded-3xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full justify-center disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("evidenceForm.submitting")}
            </>
          ) : (
            t("evidenceForm.submit", { type: evidenceTypeLabel(selectedType) })
          )}
        </button>
      </form>
    </div>
  );
}
