import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { cropLabelI18n } from "@/i18n/crops";
import type { Locale } from "@/i18n/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function shortenAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

export function formatDate(unixTimestamp: number, locale: Locale = "vi"): string {
  return new Date(unixTimestamp * 1000).toLocaleDateString(
    locale === "en" ? "en-US" : "vi-VN",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}

export function formatArea(m2: number): string {
  if (m2 >= 10000) {
    return `${(m2 / 10000).toFixed(2)} ha`;
  }
  return `${m2.toLocaleString()} m²`;
}

/** Map crop value (e.g. banana) → display label */
export function cropLabel(value: string, locale: Locale = "vi"): string {
  return cropLabelI18n(value, locale);
}

export function evidenceTypeFromAnchor(
  anchorType: Record<string, unknown>
): string {
  if ("harvest" in anchorType) return "Harvest";
  if ("soil" in anchorType) return "Soil";
  if ("carbon" in anchorType) return "Carbon";
  if ("water" in anchorType) return "Water";
  if ("biodiversity" in anchorType) return "Biodiversity";
  if ("honeyQuality" in anchorType) return "HoneyQuality";
  if ("produceQuality" in anchorType) return "ProduceQuality";
  return "Unknown";
}
