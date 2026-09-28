"use client";

import { useState } from "react";
import { Mail, Plus, Trash2, X } from "lucide-react";
import { useTranslation } from "@/i18n/LanguageProvider";
import { cn } from "@/lib/utils";

/** Local backup only — the authoritative delivery path is the API route. */
const STORAGE_KEY = "openagri_buyer_export_applications";
const CONTACT_EMAIL = "hello@openagrix.com";

/** Prefilled email so a lead survives even when delivery fails. */
function buildMailtoHref(app: BuyerExportApplication): string {
  const lines = [
    `Role: ${app.role}`,
    `Contact: ${app.contactName}`,
    `Organisation: ${app.orgName}`,
    `Email: ${app.email}`,
    `Phone: ${app.phone}`,
    `Country: ${app.country}`,
    `Tax ID: ${app.taxId}`,
    `Products: ${app.products}`,
    `Website: ${app.website}`,
    `Wallet: ${app.walletAddress ?? "-"}`,
    "",
    "Units:",
    ...app.units.map(
      (u) => `- ${u.name} (${u.type}) · ${u.location} · ${u.scale}`
    ),
    "",
    `Notes: ${app.notes}`,
  ];
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
    `Buyer & Export application — ${app.orgName}`
  )}&body=${encodeURIComponent(lines.join("\n"))}`;
}

export type ApplicantRole =
  | "buyer"
  | "exporter"
  | "trader"
  | "farm"
  | "cooperative"
  | "club"
  | "association"
  | "institute"
  | "other";

export type UnitType =
  | "farm"
  | "cooperative"
  | "club"
  | "association"
  | "institute"
  | "other";

export interface PartnerUnit {
  name: string;
  type: UnitType;
  location: string;
  scale: string;
}

export interface BuyerExportApplication {
  role: ApplicantRole;
  contactName: string;
  orgName: string;
  email: string;
  phone: string;
  address: string;
  country: string;
  taxId: string;
  products: string;
  website: string;
  notes: string;
  units: PartnerUnit[];
  walletAddress?: string;
  submittedAt: string;
}

const ROLE_KEYS: ApplicantRole[] = [
  "buyer",
  "exporter",
  "trader",
  "farm",
  "cooperative",
  "club",
  "association",
  "institute",
  "other",
];

const UNIT_TYPE_KEYS: UnitType[] = [
  "farm",
  "cooperative",
  "club",
  "association",
  "institute",
  "other",
];

const emptyUnit = (): PartnerUnit => ({
  name: "",
  type: "farm",
  location: "",
  scale: "",
});

interface BuyerExportFormModalProps {
  walletAddress?: string | null;
  onClose: () => void;
  onContinueToPayment: (application: BuyerExportApplication) => void;
}

export function BuyerExportFormModal({
  walletAddress,
  onClose,
  onContinueToPayment,
}: BuyerExportFormModalProps) {
  const { t } = useTranslation();

  const [role, setRole] = useState<ApplicantRole>("exporter");
  const [contactName, setContactName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [country, setCountry] = useState("Việt Nam");
  const [taxId, setTaxId] = useState("");
  const [products, setProducts] = useState("");
  const [website, setWebsite] = useState("");
  const [notes, setNotes] = useState("");
  const [units, setUnits] = useState<PartnerUnit[]>([emptyUnit()]);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [fallback, setFallback] = useState<BuyerExportApplication | null>(null);

  const updateUnit = (index: number, patch: Partial<PartnerUnit>) => {
    setUnits((prev) => prev.map((u, i) => (i === index ? { ...u, ...patch } : u)));
  };

  const removeUnit = (index: number) => {
    setUnits((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFallback(null);

    const filledUnits = units.filter((u) => u.name.trim());
    if (filledUnits.length === 0) {
      setError(t("buyerExport.unitsRequired"));
      return;
    }

    const application: BuyerExportApplication = {
      role,
      contactName: contactName.trim(),
      orgName: orgName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      address: address.trim(),
      country: country.trim(),
      taxId: taxId.trim(),
      products: products.trim(),
      website: website.trim(),
      notes: notes.trim(),
      units: filledUnits,
      walletAddress: walletAddress ?? undefined,
      submittedAt: new Date().toISOString(),
    };

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const list: BuyerExportApplication[] = raw ? JSON.parse(raw) : [];
      list.push(application);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch {
      /* local backup is best-effort; delivery below is what matters */
    }

    setSending(true);
    try {
      const res = await fetch("/api/buyer-export", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(application),
      });
      const data = (await res.json()) as { delivered?: boolean };
      if (!res.ok || !data.delivered) {
        setFallback(application);
        return;
      }
    } catch {
      setFallback(application);
      return;
    } finally {
      setSending(false);
    }

    onContinueToPayment(application);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-3xl border border-white/15 bg-forest-900 shadow-glow">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-white/10 bg-forest-900/95 px-6 py-5 backdrop-blur">
          <div>
            <p className="section-eyebrow !mb-2">Buyer & Export</p>
            <h2 className="text-xl font-extrabold text-white">{t("buyerExport.title")}</h2>
            <p className="mt-1 text-sm text-white/50">{t("buyerExport.subtitle")}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full p-1.5 text-white/50 hover:bg-white/10 hover:text-white"
            aria-label={t("common.close")}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto px-6 py-5">
          {/* Role */}
          <div className="mb-6">
            <label className="mb-1.5 block text-sm font-medium text-white/70">
              {t("buyerExport.role")} <span className="text-red-400">*</span>
            </label>
            <select
              required
              value={role}
              onChange={(e) => setRole(e.target.value as ApplicantRole)}
              className="field-input"
            >
              {ROLE_KEYS.map((key) => (
                <option key={key} value={key}>
                  {t(`buyerExport.roles.${key}`)}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-white/40">{t("buyerExport.roleHint")}</p>
          </div>

          {/* Applicant / seller-exporter */}
          <div className="mb-6">
            <h3 className="mb-3 text-sm font-bold text-white">{t("buyerExport.sectionApplicant")}</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-white/70">
                  {t("buyerExport.contactName")} <span className="text-red-400">*</span>
                </label>
                <input
                  required
                  className="field-input"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder={t("buyerExport.contactNamePh")}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-white/70">
                  {t("buyerExport.orgName")} <span className="text-red-400">*</span>
                </label>
                <input
                  required
                  className="field-input"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder={t("buyerExport.orgNamePh")}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-white/70">
                  {t("buyerExport.email")} <span className="text-red-400">*</span>
                </label>
                <input
                  required
                  type="email"
                  className="field-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contact@company.com"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-white/70">
                  {t("buyerExport.phone")} <span className="text-red-400">*</span>
                </label>
                <input
                  required
                  type="tel"
                  className="field-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+84 ..."
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-white/70">
                  {t("buyerExport.country")}
                </label>
                <input
                  className="field-input"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-white/70">
                  {t("buyerExport.taxId")}
                </label>
                <input
                  className="field-input"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  placeholder={t("buyerExport.taxIdPh")}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-white/70">
                  {t("buyerExport.address")}
                </label>
                <input
                  className="field-input"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={t("buyerExport.addressPh")}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-white/70">
                  {t("buyerExport.products")} <span className="text-red-400">*</span>
                </label>
                <input
                  required
                  className="field-input"
                  value={products}
                  onChange={(e) => setProducts(e.target.value)}
                  placeholder={t("buyerExport.productsPh")}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-white/70">
                  {t("buyerExport.website")}
                </label>
                <input
                  type="text"
                  className="field-input"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://"
                />
              </div>
            </div>
          </div>

          {/* Partner units */}
          <div className="mb-6">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-white">{t("buyerExport.sectionUnits")}</h3>
              <button
                type="button"
                onClick={() => setUnits((prev) => [...prev, emptyUnit()])}
                className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1.5 text-xs font-semibold text-purple-200 hover:bg-purple-500/20"
              >
                <Plus className="h-3.5 w-3.5" />
                {t("buyerExport.addUnit")}
              </button>
            </div>
            <p className="mb-4 text-xs text-white/40">{t("buyerExport.unitsHint")}</p>

            <div className="space-y-4">
              {units.map((unit, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-white/40">
                      {t("buyerExport.unitN", { n: index + 1 })}
                    </span>
                    {units.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeUnit(index)}
                        className="rounded-full p-1.5 text-white/40 hover:bg-red-500/10 hover:text-red-300"
                        aria-label={t("buyerExport.removeUnit")}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className="mb-1.5 block text-xs font-medium text-white/60">
                        {t("buyerExport.unitName")} <span className="text-red-400">*</span>
                      </label>
                      <input
                        className="field-input"
                        value={unit.name}
                        onChange={(e) => updateUnit(index, { name: e.target.value })}
                        placeholder={t("buyerExport.unitNamePh")}
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-white/60">
                        {t("buyerExport.unitType")}
                      </label>
                      <select
                        className="field-input"
                        value={unit.type}
                        onChange={(e) =>
                          updateUnit(index, { type: e.target.value as UnitType })
                        }
                      >
                        {UNIT_TYPE_KEYS.map((key) => (
                          <option key={key} value={key}>
                            {t(`buyerExport.unitTypes.${key}`)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-white/60">
                        {t("buyerExport.unitScale")}
                      </label>
                      <input
                        className="field-input"
                        value={unit.scale}
                        onChange={(e) => updateUnit(index, { scale: e.target.value })}
                        placeholder={t("buyerExport.unitScalePh")}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1.5 block text-xs font-medium text-white/60">
                        {t("buyerExport.unitLocation")}
                      </label>
                      <input
                        className="field-input"
                        value={unit.location}
                        onChange={(e) => updateUnit(index, { location: e.target.value })}
                        placeholder={t("buyerExport.unitLocationPh")}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="mb-6">
            <label className="mb-1.5 block text-sm font-medium text-white/70">
              {t("buyerExport.notes")}
            </label>
            <textarea
              rows={3}
              className="field-input resize-y"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("buyerExport.notesPh")}
            />
          </div>

          {error && (
            <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
              {error}
            </div>
          )}

          {fallback && (
            <div className="mb-4 space-y-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
              <p className="text-xs leading-relaxed text-amber-200">
                {t("buyerExport.deliveryFailed")}
              </p>
              <a
                href={buildMailtoHref(fallback)}
                className="inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/15 px-4 py-2 text-xs font-semibold text-amber-100 hover:bg-amber-500/25"
              >
                <Mail className="h-3.5 w-3.5" />
                {t("buyerExport.sendByEmail")}
              </a>
            </div>
          )}

          <div className="flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white/70 hover:bg-white/5"
            >
              {t("buyerExport.cancel")}
            </button>
            {fallback ? (
              <button
                type="button"
                onClick={() => onContinueToPayment(fallback)}
                className="rounded-full bg-purple-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-purple-400"
              >
                {t("buyerExport.continueAnyway")}
              </button>
            ) : (
              <button
                type="submit"
                disabled={sending}
                className={cn(
                  "rounded-full bg-purple-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-purple-400",
                  sending && "cursor-wait opacity-70"
                )}
              >
                {sending ? t("buyerExport.sending") : t("buyerExport.submit")}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
