"use client";

import { CheckCircle, ExternalLink, X } from "lucide-react";
import { explorerTxUrl } from "@/lib/constants";

interface TxSuccessBannerProps {
  txSig: string;
  message: string;
  onDismiss?: () => void;
}

export function TxSuccessBanner({ txSig, message, onDismiss }: TxSuccessBannerProps) {
  return (
    <div className="flex items-start gap-3 rounded-3xl border border-agri-500/30 bg-agri-500/10 p-4">
      <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-agri-400" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-agri-300">{message}</p>
        <a
          href={explorerTxUrl(txSig)}
          target="_blank"
          rel="noreferrer"
          className="mt-1 flex items-center gap-1 text-xs text-agri-400 transition-colors hover:text-agri-300"
        >
          <code className="truncate">{txSig.slice(0, 20)}...{txSig.slice(-8)}</code>
          <ExternalLink className="h-3 w-3 shrink-0" />
        </a>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-agri-400/60 transition-colors hover:text-agri-300"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
