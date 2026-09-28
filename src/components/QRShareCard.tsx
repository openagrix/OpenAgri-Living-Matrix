"use client";

import { useState } from "react";
import { Copy, Check, QrCode } from "lucide-react";
import { useTranslation } from "@/i18n/LanguageProvider";

interface QRShareCardProps {
  ownerAddress: string;
  farmName: string;
  farmId: string;
}

export function QRShareCard({ ownerAddress, farmName, farmId }: QRShareCardProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/farm/${ownerAddress}?farmId=${farmId}`
      : `/farm/${ownerAddress}?farmId=${farmId}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Simple QR-like visual placeholder (real QR would need a library like qrcode.react)
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-white/80">
        <QrCode className="h-4 w-4 text-agri-400" />
        {t("qr.title")}
      </div>
      <p className="mb-4 text-xs text-white/50">
        {t("qr.description", { farmName })}
      </p>

      {/* QR placeholder */}
      <div className="mb-4 flex items-center justify-center rounded-2xl border border-agri-500/20 bg-agri-500/10 p-6">
        <div className="text-center">
          <QrCode className="mx-auto mb-2 h-16 w-16 text-agri-400" />
          <p className="text-xs text-agri-300/80">
            {t("qr.placeholder")}
          </p>
        </div>
      </div>

      {/* URL copy */}
      <div className="flex items-center gap-2">
        <div className="flex-1 truncate rounded-2xl border border-white/10 bg-forest-900/60 px-3 py-2 font-mono text-xs text-white/60">
          {url}
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-full border border-agri-500/30 bg-agri-500/10 px-3 py-2 text-xs font-medium text-agri-300 transition-colors hover:bg-agri-500/20"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5" />
              {t("qr.copied")}
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              {t("qr.copy")}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
