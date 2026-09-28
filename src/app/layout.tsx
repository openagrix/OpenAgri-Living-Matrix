import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { WalletContextProvider } from "@/components/WalletContextProvider";
import { LanguageProvider } from "@/i18n/LanguageProvider";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-jakarta",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

/**
 * Absolute base for Open Graph / Twitter image URLs. Vercel exposes the
 * deployment host as VERCEL_URL (without a scheme); NEXT_PUBLIC_SITE_URL wins
 * when a custom domain is configured.
 */
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ??
  "https://openagrix.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "OpenAgriX — Proof of Agriculture on Solana",
  description:
    "Nền tảng lưu trữ bằng chứng nông nghiệp minh bạch và bất biến trên Solana. Harvest, Soil, Carbon — được xác minh trực tiếp on-chain.",
  keywords: [
    "solana",
    "agriculture",
    "vietnam",
    "blockchain",
    "carbon",
    "openagrix",
    "trầm hương",
    "CITES",
  ],
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32.png", type: "image/png", sizes: "32x32" },
      { url: "/logo-icon.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: "/favicon.ico",
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  openGraph: {
    title: "OpenAgriX — Agricultural Evidence on Solana",
    description: "Vietnam's verifiable agricultural trust layer on Solana",
    type: "website",
    images: ["/logo.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={jakarta.variable} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <WalletContextProvider>
          <LanguageProvider>
            <div className="relative min-h-screen bg-forest-900 text-white">
              <div
                className="pointer-events-none absolute inset-x-0 top-0 h-[70vh] hero-glow"
                aria-hidden
              />
              <Navbar />
              <main className="relative z-10 min-h-screen pt-24">{children}</main>
              <Footer />
            </div>
          </LanguageProvider>
        </WalletContextProvider>
      </body>
    </html>
  );
}
