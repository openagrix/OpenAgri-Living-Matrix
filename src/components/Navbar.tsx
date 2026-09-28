"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import {
  Menu,
  X,
  Shield,
  Leaf,
  LayoutDashboard,
  Search,
  Plus,
  Home,
  Zap,
  ArrowRight,
  Crown,
  Gem,
} from "lucide-react";
import { useRole } from "@/hooks/useRole";
import { useSubscription } from "@/hooks/useSubscription";
import { useTranslation } from "@/i18n/LanguageProvider";
import { cn } from "@/lib/utils";
import type { Locale } from "@/i18n/types";

export function Navbar() {
  const { isAdmin, isMember, walletAddress } = useRole();
  const { hidePricing, isVip, isInvestor } = useSubscription(walletAddress);
  const { t, locale, setLocale } = useTranslation();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const myFarmHref = walletAddress ? `/farm/${walletAddress}` : "/farm/register";

  const publicLinks = [
    { href: "/", label: t("nav.home"), icon: Home },
    { href: "/explore", label: t("nav.explore"), icon: Search },
    ...(!hidePricing
      ? [{ href: "/pricing", label: t("nav.pricing"), icon: Zap }]
      : []),
  ];

  const navLinks = [
    ...publicLinks,
    ...(isMember
      ? [
          { href: "/farm/register", label: t("nav.registerFarm"), icon: Plus },
          { href: myFarmHref, label: t("nav.myFarm"), icon: Leaf },
        ]
      : []),
    ...(isAdmin ? [{ href: "/admin", label: t("nav.admin"), icon: LayoutDashboard }] : []),
  ];

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const toggleLocale = () => {
    const next: Locale = locale === "vi" ? "en" : "vi";
    setLocale(next);
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-4 sm:px-6">
      <nav
        className={cn(
          "mx-auto flex max-w-6xl items-center justify-between gap-3",
          "rounded-full border border-white/10 bg-forest-800/70 px-3 py-2 shadow-glow-sm backdrop-blur-xl",
          "sm:px-5 sm:py-2.5"
        )}
      >
        <Link href="/" className="flex shrink-0 items-center pl-1">
          <Image
            src="/logo-icon.png"
            alt="OpenAgriX"
            width={36}
            height={36}
            priority
            className="h-8 w-8 sm:hidden"
          />
          <Image
            src="/logo-dark.png"
            alt="OpenAgriX"
            width={800}
            height={237}
            priority
            className="hidden h-8 w-auto sm:block sm:h-9"
          />
        </Link>

        <div className="hidden items-center gap-0.5 md:flex">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href + label}
              href={href}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                isActive(href)
                  ? "bg-white/10 text-white"
                  : "text-white/60 hover:bg-white/5 hover:text-white"
              )}
            >
              {label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleLocale}
            className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-white/80 transition-colors hover:border-agri-500/40 hover:text-white"
            aria-label={locale === "vi" ? "Switch to English" : "Chuyển sang Tiếng Việt"}
            title={locale === "vi" ? "English" : "Tiếng Việt"}
          >
            <span className={locale === "vi" ? "text-agri-400" : "text-white/40"}>VI</span>
            <span className="text-white/25">/</span>
            <span className={locale === "en" ? "text-agri-400" : "text-white/40"}>EN</span>
          </button>

          {isInvestor && (
            <span className="hidden items-center gap-1 rounded-full border border-white/25 bg-white/10 px-2.5 py-1 text-xs font-semibold text-white sm:inline-flex">
              <Gem className="h-3 w-3" />
              {t("nav.investorBadge")}
            </span>
          )}
          {isVip && !isInvestor && (
            <span className="hidden items-center gap-1 rounded-full border border-amber-400/40 bg-amber-500/15 px-2.5 py-1 text-xs font-semibold text-amber-300 sm:inline-flex">
              <Crown className="h-3 w-3" />
              {t("nav.vipBadge")}
            </span>
          )}

          {isAdmin && (
            <span className="hidden items-center gap-1 rounded-full border border-red-400/30 bg-red-500/15 px-2.5 py-1 text-xs font-semibold text-red-300 sm:inline-flex">
              <Shield className="h-3 w-3" />
              {t("nav.adminBadge")}
            </span>
          )}
          {isMember && !isAdmin && !isVip && !isInvestor && (
            <span className="hidden items-center gap-1 rounded-full border border-agri-500/30 bg-agri-500/10 px-2.5 py-1 text-xs font-medium text-agri-300 sm:inline-flex">
              <Leaf className="h-3 w-3" />
              {t("nav.memberBadge")}
            </span>
          )}

          {!walletAddress && (
            <Link
              href="/farm/register"
              className="btn-secondary hidden !px-4 !py-2 text-xs lg:inline-flex"
            >
              {t("nav.register")}
            </Link>
          )}

          <div className="[&_.wallet-adapter-button]:!h-9 [&_.wallet-adapter-button]:!text-xs">
            <WalletMultiButton />
          </div>

          {!walletAddress && (
            <Link href="/explore" className="btn-primary hidden !px-4 !py-2 text-xs sm:inline-flex">
              {t("nav.tryNow")}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}

          <button
            className="rounded-full p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white md:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div className="mx-auto mt-2 max-w-6xl overflow-hidden rounded-3xl border border-white/10 bg-forest-800/95 px-4 py-4 shadow-glow backdrop-blur-xl md:hidden">
          {isInvestor && (
            <div className="mb-3 flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-3 py-2">
              <Gem className="h-4 w-4 text-white" />
              <span className="text-sm font-semibold text-white">{t("nav.investorBadge")}</span>
            </div>
          )}
          {isVip && !isInvestor && (
            <div className="mb-3 flex items-center gap-2 rounded-2xl border border-amber-400/30 bg-amber-500/10 px-3 py-2">
              <Crown className="h-4 w-4 text-amber-400" />
              <span className="text-sm font-semibold text-amber-300">{t("nav.vipBadge")}</span>
            </div>
          )}
          {isAdmin && (
            <div className="mb-3 flex items-center gap-2 rounded-2xl border border-red-400/20 bg-red-500/10 px-3 py-2">
              <Shield className="h-4 w-4 text-red-400" />
              <span className="text-sm font-semibold text-red-300">{t("nav.administrator")}</span>
            </div>
          )}
          {isMember && !isAdmin && !isVip && !isInvestor && (
            <div className="mb-3 flex items-center gap-2 rounded-2xl border border-agri-500/20 bg-agri-500/10 px-3 py-2">
              <Leaf className="h-4 w-4 text-agri-400" />
              <span className="text-sm font-medium text-agri-300">{t("nav.memberBadge")}</span>
            </div>
          )}

          <nav className="flex flex-col gap-1">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href + label}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive(href)
                    ? "bg-white/10 text-white"
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            ))}
          </nav>

          <button
            type="button"
            onClick={toggleLocale}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 py-2.5 text-sm font-semibold text-white/80"
          >
            {locale === "vi" ? "English (EN)" : "Tiếng Việt (VI)"}
          </button>
        </div>
      )}
    </header>
  );
}
