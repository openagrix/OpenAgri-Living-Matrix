"use client";

import Link from "next/link";
import { useTranslation } from "@/i18n/LanguageProvider";

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <p className="mb-3 text-sm font-semibold tracking-wide text-agri-400">404</p>
      <h1 className="mb-2 text-2xl font-extrabold text-white">{t("notFound.title")}</h1>
      <p className="mb-8 text-white/50">{t("notFound.desc")}</p>
      <Link href="/" className="btn-primary">
        {t("common.backHome")}
      </Link>
    </div>
  );
}
