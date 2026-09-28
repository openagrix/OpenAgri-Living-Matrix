"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { CheckCircle, Loader2, Leaf, Plus, AlertCircle } from "lucide-react";
import { useFarm } from "@/hooks/useFarm";
import { CROP_OPTIONS, explorerTxUrl } from "@/lib/constants";
import { useTranslation } from "@/i18n/LanguageProvider";
import { cropLabel } from "@/lib/utils";
import type { RegisterFarmForm } from "@/types/openagri";

export default function RegisterFarmPage() {
  const { t, locale } = useTranslation();
  const { publicKey } = useWallet();
  const { registerFarm, checkFarmExists, fetchMyFarms, loading, error } = useFarm();
  const router = useRouter();

  const [form, setForm] = useState<RegisterFarmForm>({
    farmId: "",
    name: "",
    location: "",
    cropTypes: [],
    areaM2: 0,
  });
  const [txSig, setTxSig] = useState<string | null>(null);
  const [myFarms, setMyFarms] = useState<{ farmId: string; name: string }[]>([]);
  const [farmIdError, setFarmIdError] = useState<string | null>(null);
  const [checkingId, setCheckingId] = useState(false);

  // Load existing farms of connected wallet
  useEffect(() => {
    if (!publicKey) return;
    fetchMyFarms().then((farms) =>
      setMyFarms(farms.map((f) => ({ farmId: f.account.farmId, name: f.account.name })))
    );
  }, [publicKey]);

  // Check farmId uniqueness on blur
  const handleFarmIdBlur = async () => {
    if (!form.farmId || !publicKey) return;
    setCheckingId(true);
    setFarmIdError(null);
    const exists = await checkFarmExists(form.farmId);
    if (exists) setFarmIdError(t("register.farmIdExists", { id: form.farmId }));
    setCheckingId(false);
  };

  const handleCropToggle = (val: string) => {
    setForm((f) => ({
      ...f,
      cropTypes: f.cropTypes.includes(val)
        ? f.cropTypes.filter((c) => c !== val)
        : [...f.cropTypes, val],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (farmIdError) return;
    const sig = await registerFarm(form);
    if (sig) setTxSig(sig);
  };

  // ─── Success state ────────────────────────────────────────────────────────
  if (txSig) {
    return (
      <div className="mx-auto max-w-lg py-20 text-center">
        <CheckCircle className="mx-auto mb-4 h-16 w-16 text-agri-400" />
        <h2 className="mb-2 text-2xl font-bold text-white">{t("register.successTitle")}</h2>
        <p className="mb-2 text-white/50">{t("register.successBody", { name: form.name })}</p>
        {myFarms.length > 0 && (
          <p className="mb-6 text-sm text-agri-400">
            {t("register.farmCount", { n: myFarms.length + 1 })}
          </p>
        )}
        <div className="mb-8 break-all rounded-3xl border border-white/10 bg-white/[0.03] p-4 font-mono text-xs text-white/60">
          TX: {txSig}
        </div>
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <a href={explorerTxUrl(txSig)} target="_blank" rel="noreferrer"
            className="btn-ghost">
            {t("register.viewExplorer")}
          </a>
          <button onClick={() => router.push(`/farm/${publicKey?.toBase58()}?farmId=${form.farmId}`)}
            className="btn-primary">
            {t("register.goDashboard")}
          </button>
        </div>
        <button onClick={() => { setTxSig(null); setForm({ farmId: "", name: "", location: "", cropTypes: [], areaM2: 0 }); }}
          className="mt-4 text-sm text-white/45 underline hover:text-white/70">
          {t("register.another")}
        </button>
      </div>
    );
  }

  // ─── No wallet ────────────────────────────────────────────────────────────
  if (!publicKey) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <Leaf className="h-12 w-12 text-agri-400/50" />
        <p className="text-white/60">{t("register.connectWallet")}</p>
        <WalletMultiButton />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <p className="section-eyebrow">Farm</p>
          <h1 className="text-3xl font-extrabold text-white">{t("register.title")}</h1>
          <p className="mt-2 text-white/50">{t("register.subtitle")}</p>
        </div>
        {/* My farms count */}
        {myFarms.length > 0 && (
          <div className="shrink-0 rounded-3xl border border-agri-500/20 bg-agri-500/10 px-4 py-3 text-center">
            <div className="text-2xl font-bold text-agri-400">{myFarms.length}</div>
            <div className="text-xs text-agri-300">{t("register.existingCount")}</div>
          </div>
        )}
      </div>

      {/* Existing farms quick-nav */}
      {myFarms.length > 0 && (
        <div className="mb-8 rounded-3xl border border-white/10 bg-white/[0.03] p-4">
          <p className="mb-3 flex items-center gap-2 text-sm font-medium text-agri-300">
            <Leaf className="h-4 w-4" /> {t("register.yourFarms")}
          </p>
          <div className="flex flex-wrap gap-2">
            {myFarms.map((f) => (
              <button
                key={f.farmId}
                onClick={() => router.push(`/farm/${publicKey.toBase58()}?farmId=${f.farmId}`)}
                className="rounded-full border border-agri-500/20 bg-agri-500/10 px-3 py-1.5 text-sm text-agri-300 transition-colors hover:border-agri-500/40"
              >
                {f.name} <span className="text-xs text-agri-400/70">#{f.farmId}</span>
              </button>
            ))}
            <button
              onClick={() => router.push(`/farm/${publicKey.toBase58()}`)}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/60 transition-colors hover:border-white/20"
            >
              {t("register.viewAll")}
            </button>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Farm ID */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-white/70">
            {t("register.farmId")} <span className="text-red-400">*</span>
            <span className="ml-2 text-xs font-normal text-white/40">
              {t("register.farmIdHint")}
            </span>
          </label>
          <div className="relative">
            <input
              type="text"
              maxLength={20}
              required
              placeholder="kim-long-001, farm-cocoa-02"
              value={form.farmId}
              onChange={(e) => {
                setFarmIdError(null);
                setForm((f) => ({ ...f, farmId: e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-_]/g, "") }));
              }}
              onBlur={handleFarmIdBlur}
              className={`field-input pr-10 ${
                farmIdError
                  ? "border-red-500/50 focus:border-red-400 focus:ring-red-500/20"
                  : ""
              }`}
            />
            {checkingId && (
              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-white/40" />
            )}
          </div>
          {farmIdError && (
            <p className="mt-1.5 flex items-center gap-1 text-xs text-red-400">
              <AlertCircle className="h-3.5 w-3.5" /> {farmIdError}
            </p>
          )}
          {!farmIdError && form.farmId && !checkingId && (
            <p className="mt-1 flex items-center gap-1 text-xs text-agri-400">
              <CheckCircle className="h-3 w-3" /> {t("register.idValid")}
            </p>
          )}
        </div>

        {/* Farm name */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-white/70">
            {t("register.name")} <span className="text-red-400">*</span>
          </label>
          <input
            type="text" maxLength={100} required
            placeholder={t("register.namePh")}
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="field-input"
          />
        </div>

        {/* Location */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-white/70">
            {t("register.location")} <span className="text-red-400">*</span>
          </label>
          <input
            type="text" maxLength={150} required
            placeholder={t("register.locationPh")}
            value={form.location}
            onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
            className="field-input"
          />
        </div>

        {/* Area */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-white/70">
            {t("register.area")} <span className="text-red-400">*</span>
          </label>
          <input
            type="number" min={1} required
            placeholder="5000"
            value={form.areaM2 || ""}
            onChange={(e) => setForm((f) => ({ ...f, areaM2: parseInt(e.target.value) || 0 }))}
            className="field-input"
          />
          {form.areaM2 >= 10000 && (
            <p className="mt-1 text-xs text-agri-400">≈ {(form.areaM2 / 10000).toFixed(2)} ha</p>
          )}
        </div>

        {/* Crop types */}
        <div>
          <label className="mb-2 block text-sm font-medium text-white/70">
            {t("register.crops")} <span className="text-red-400">*</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {CROP_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleCropToggle(opt.value)}
                className={`rounded-full border px-3 py-2 text-sm transition-colors ${
                  form.cropTypes.includes(opt.value)
                    ? "border-agri-500/40 bg-agri-500/15 font-medium text-agri-300"
                    : "border-white/10 bg-white/[0.03] text-white/60 hover:border-agri-500/30"
                }`}
              >
                {cropLabel(opt.value, locale)}
              </button>
            ))}
          </div>
          {form.cropTypes.length === 0 && (
            <p className="mt-1 text-xs text-red-400">{t("register.cropsRequired")}</p>
          )}
        </div>

        {error && (
          <div className="rounded-3xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || form.cropTypes.length === 0 || !!farmIdError || !form.farmId || checkingId}
          className="btn-primary w-full justify-center disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> {t("register.submitting")}</>
          ) : (
            <><Plus className="h-4 w-4" /> {t("register.submit")}</>
          )}
        </button>
      </form>
    </div>
  );
}
