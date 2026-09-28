"use client";

import { useState } from "react";
import { CheckCircle, ShieldQuestion, XCircle } from "lucide-react";
import { verifyEvidenceJson } from "@/lib/hash";
import { useTranslation } from "@/i18n/LanguageProvider";

type CheckState =
  | { kind: "idle" }
  | { kind: "match"; computed: string }
  | { kind: "mismatch"; computed: string; onChain: string }
  | { kind: "invalid" };

/**
 * Lets a buyer paste the off-chain JSON they received and confirm it hashes to
 * the digest stored on-chain. This is the step that turns "trust OpenAgriX" into
 * "check it yourself" — it runs entirely in the browser.
 */
export function EvidenceHashChecker({ onChainHash }: { onChainHash: number[] }) {
  const { t } = useTranslation();
  const [raw, setRaw] = useState("");
  const [state, setState] = useState<CheckState>({ kind: "idle" });
  const [checking, setChecking] = useState(false);

  const handleCheck = async () => {
    setChecking(true);
    try {
      const { ok, computedHex, onChainHex } = await verifyEvidenceJson(raw, onChainHash);
      setState(
        ok
          ? { kind: "match", computed: computedHex }
          : { kind: "mismatch", computed: computedHex, onChain: onChainHex }
      );
    } catch {
      setState({ kind: "invalid" });
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="space-y-3 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
      <div className="flex items-start gap-3">
        <ShieldQuestion className="mt-0.5 h-5 w-5 shrink-0 text-agri-400" />
        <div>
          <p className="font-semibold text-white">{t("hashCheck.title")}</p>
          <p className="mt-1 text-sm text-white/50">{t("hashCheck.description")}</p>
        </div>
      </div>

      <textarea
        rows={6}
        value={raw}
        onChange={(e) => {
          setRaw(e.target.value);
          setState({ kind: "idle" });
        }}
        placeholder={t("hashCheck.placeholder")}
        className="field-input resize-y font-mono text-xs"
      />

      <button
        type="button"
        onClick={handleCheck}
        disabled={!raw.trim() || checking}
        className="btn-primary w-full justify-center disabled:opacity-50"
      >
        {checking ? t("hashCheck.checking") : t("hashCheck.action")}
      </button>

      {state.kind === "match" && (
        <div className="flex items-start gap-3 rounded-2xl border border-agri-500/30 bg-agri-500/10 p-4">
          <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-agri-400" />
          <div className="min-w-0">
            <p className="font-semibold text-agri-300">{t("hashCheck.matchTitle")}</p>
            <p className="mt-1 break-all font-mono text-xs text-agri-400/80">
              {state.computed}
            </p>
          </div>
        </div>
      )}

      {state.kind === "mismatch" && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
          <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
          <div className="min-w-0 space-y-1">
            <p className="font-semibold text-red-300">{t("hashCheck.mismatchTitle")}</p>
            <p className="text-xs text-red-300/80">{t("hashCheck.mismatchBody")}</p>
            <p className="break-all font-mono text-xs text-red-300/70">
              {t("hashCheck.computed")}: {state.computed}
            </p>
            <p className="break-all font-mono text-xs text-red-300/70">
              {t("hashCheck.onChain")}: {state.onChain}
            </p>
          </div>
        </div>
      )}

      {state.kind === "invalid" && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-200">
          {t("hashCheck.invalidJson")}
        </div>
      )}
    </div>
  );
}
