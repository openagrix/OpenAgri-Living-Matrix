"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/i18n/LanguageProvider";
import { useRole } from "@/hooks/useRole";
import { useSubscription } from "@/hooks/useSubscription";
import { BuyerExportFormModal } from "@/components/BuyerExportFormModal";
import { PaymentModal } from "@/components/PaymentModal";
import { toPurchaseEvidence, type PaymentResult } from "@/hooks/usePayment";

const PARTNERS = [
  {
    name: "HGBA — Hiệp hội Doanh nghiệp Xanh TP.HCM",
    src: "/partner/cooperatives/hiep-hoi-doanh-nghiep-xanh.jpg",
    width: 140,
    height: 140,
  },
  {
    name: "Ong dú Win's Farm",
    src: "/partner/cooperatives/ong-du-win-farm.jpg",
    width: 140,
    height: 128,
    href: "/guides/ong-du",
  },
  {
    name: "VIETD — Vietnam Institute for Entrepreneur Training and Development",
    src: "/partner/cooperatives/vietd.jpg",
    width: 110,
    height: 132,
  },
] as const;

const SPONSORS = [
  {
    name: "Solana",
    href: "https://solana.com",
    src: "/partner/solana-logo.jpg",
    width: 160,
    height: 70,
  },
  {
    name: "Superteam Vietnam",
    href: "https://vn.superteam.fun",
    src: "/partner/superteamvn-logo.jpg",
    width: 280,
    height: 58,
  },
] as const;

export function Footer() {
  const { t } = useTranslation();
  const router = useRouter();
  const { walletAddress } = useRole();
  const { subscribe } = useSubscription(walletAddress);

  const [buyerFormOpen, setBuyerFormOpen] = useState(false);
  const [payBuyerOpen, setPayBuyerOpen] = useState(false);

  const handleBuyerFormContinue = useCallback(() => {
    setBuyerFormOpen(false);
    if (walletAddress) {
      setPayBuyerOpen(true);
      return;
    }
    router.push("/pricing?highlight=combo");
  }, [walletAddress, router]);

  const handleBuyerPaymentSuccess = useCallback(
    (result: PaymentResult) => {
      subscribe("combo", "yearly", toPurchaseEvidence(result));
      setPayBuyerOpen(false);
    },
    [subscribe]
  );

  return (
    <>
      {buyerFormOpen && (
        <BuyerExportFormModal
          walletAddress={walletAddress}
          onClose={() => setBuyerFormOpen(false)}
          onContinueToPayment={handleBuyerFormContinue}
        />
      )}

      {payBuyerOpen && (
        <PaymentModal
          planId="combo"
          billingCycle="yearly"
          onClose={() => setPayBuyerOpen(false)}
          onSuccess={handleBuyerPaymentSuccess}
        />
      )}

      {/* Partners: co-ops / farms / clubs / associations / institutes */}
      <section
        aria-label={t("footer.partners")}
        className="relative z-10 w-full border-t border-forest-900/10 bg-cream-100"
      >
        <div className="mx-auto flex max-w-7xl flex-col items-center px-4 py-12 sm:px-6 sm:py-14">
          <p className="mb-8 max-w-3xl text-center text-[11px] font-semibold uppercase leading-relaxed tracking-[0.18em] text-forest-700/55 sm:tracking-[0.22em]">
            {t("footer.partners")}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12 md:gap-16">
            {PARTNERS.map((p) => {
              const inner = (
                <Image
                  src={p.src}
                  alt={p.name}
                  width={p.width}
                  height={p.height}
                  className="h-16 w-auto object-contain sm:h-20 md:h-24"
                />
              );
              const box =
                "flex items-center justify-center rounded-2xl bg-white/70 p-3 shadow-sm ring-1 ring-forest-900/5";
              if ("href" in p && p.href) {
                return (
                  <Link key={p.name} href={p.href} title={p.name} className={box}>
                    {inner}
                  </Link>
                );
              }
              return (
                <div key={p.name} title={p.name} className={box}>
                  {inner}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Full-width sponsor / community band */}
      <section
        aria-label={t("footer.sponsors")}
        className="relative z-10 w-full border-t border-white/10 bg-forest-950"
      >
        <div className="mx-auto flex max-w-7xl flex-col items-center px-4 py-12 sm:px-6 sm:py-14">
          <p className="mb-8 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/45">
            {t("footer.sponsors")}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-10 sm:gap-16">
            {SPONSORS.map((s) => (
              <a
                key={s.name}
                href={s.href}
                target="_blank"
                rel="noreferrer"
                className="opacity-80 transition-opacity hover:opacity-100"
                title={s.name}
              >
                <Image
                  src={s.src}
                  alt={s.name}
                  width={s.width}
                  height={s.height}
                  className="h-10 w-auto object-contain sm:h-12 md:h-14"
                />
              </a>
            ))}
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-forest-900/10 bg-[#f3efe6] text-forest-900">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <div className="mb-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div className="lg:col-span-1">
              <div className="mb-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.png" alt="OpenAgriX" className="h-9 w-auto" />
              </div>
              <p className="max-w-xs text-sm leading-relaxed text-forest-700/70">
                {t("footer.blurb")}
              </p>
            </div>

            <div>
              <h3 className="mb-4 text-sm font-bold text-forest-900">{t("footer.products")}</h3>
              <ul className="space-y-2.5 text-sm text-forest-700/80">
                <li>
                  <Link href="/explore" className="underline decoration-forest-900/20 underline-offset-4 hover:text-agri-700">
                    {t("footer.explore")}
                  </Link>
                </li>
                <li>
                  <Link href="/farm/register" className="underline decoration-forest-900/20 underline-offset-4 hover:text-agri-700">
                    {t("footer.register")}
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="underline decoration-forest-900/20 underline-offset-4 hover:text-agri-700">
                    {t("footer.pricing")}
                  </Link>
                </li>
                <li>
                  <a
                    href="https://explorer.solana.com/?cluster=devnet"
                    target="_blank"
                    rel="noreferrer"
                    className="underline decoration-forest-900/20 underline-offset-4 hover:text-agri-700"
                  >
                    {t("footer.solanaExplorer")}
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="mb-4 text-sm font-bold text-forest-900">{t("footer.solutions")}</h3>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-agri-600">
                {t("footer.forGrowers")}
              </p>
              <ul className="space-y-2.5 text-sm text-forest-700/80">
                <li>
                  <Link
                    href="/guides/evidence"
                    className="underline decoration-forest-900/20 underline-offset-4 hover:text-agri-700"
                  >
                    {t("footer.evidenceGuide")}
                  </Link>
                </li>
                <li>
                  <span className="underline decoration-forest-900/20 underline-offset-4">
                    {t("footer.farmers")}
                  </span>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setBuyerFormOpen(true)}
                    className="underline decoration-forest-900/20 underline-offset-4 hover:text-agri-700"
                  >
                    {t("footer.buyers")}
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="mb-4 text-sm font-bold text-forest-900">{t("footer.company")}</h3>
              <ul className="space-y-2.5 text-sm text-forest-700/80">
                <li>
                  <a
                    href="https://github.com/openagrix/OpenAgri-Living-Matrix"
                    target="_blank"
                    rel="noreferrer"
                    className="underline decoration-forest-900/20 underline-offset-4 hover:text-agri-700"
                  >
                    {t("footer.github")}
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:hello@openagrix.com"
                    className="inline-flex items-center gap-2 underline decoration-forest-900/20 underline-offset-4 hover:text-agri-700"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    hello@openagrix.com
                  </a>
                </li>
                <li>
                  <a
                    href="https://x.com/OpenAgriX"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 underline decoration-forest-900/20 underline-offset-4 hover:text-agri-700"
                  >
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                    X / @OpenAgriX
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col items-start justify-between gap-4 border-t border-forest-900/10 pt-8 sm:flex-row sm:items-center">
            <p className="text-xs text-forest-700/50">{t("footer.copyright")}</p>
            <p className="text-xs text-forest-700/50">{t("footer.madeFor")}</p>
          </div>
        </div>
      </footer>
    </>
  );
}
