import type { Locale } from "./types";

/** Crop value → emoji + bilingual label (without emoji in dict for reuse) */
export const CROP_I18N: Record<string, { emoji: string; vi: string; en: string }> = {
  banana: { emoji: "🍌", vi: "Chuối", en: "Banana" },
  cocoa: { emoji: "🍫", vi: "Ca cao", en: "Cocoa" },
  bee: { emoji: "🐝", vi: "Ong dú", en: "Stingless bee (ong dú)" },
  compost: { emoji: "♻️", vi: "Phân hữu cơ", en: "Organic fertilizer" },
  coffee: { emoji: "☕", vi: "Cà phê", en: "Coffee" },
  durian: { emoji: "🌿", vi: "Sầu riêng", en: "Durian" },
  macadamia: { emoji: "🥜", vi: "Mắc ca", en: "Macadamia" },
  vegetable: { emoji: "🥦", vi: "Rau sạch", en: "Clean / safe vegetables" },
  flower: { emoji: "🌸", vi: "Hoa", en: "Flowers" },
  agarwood: { emoji: "☘️", vi: "Dó bầu (Aquilaria)", en: "Agarwood / dó bầu (Aquilaria)" },
  kyanam: { emoji: "🪵", vi: "Kỳ nam", en: "Kyara / kỳ nam" },
  "agarwood-oil": { emoji: "🛢️", vi: "Tinh dầu trầm", en: "Agarwood essential oil" },
  cites: { emoji: "📜", vi: "CITES plantation", en: "CITES plantation" },
  "plantation-carbon": { emoji: "🌳", vi: "Carbon rừng trồng", en: "Plantation forest carbon" },
  rice: { emoji: "🌾", vi: "Lúa", en: "Rice" },
  pepper: { emoji: "🌶️", vi: "Tiêu", en: "Pepper" },
  mango: { emoji: "🥭", vi: "Xoài", en: "Mango" },
  jackfruit: { emoji: "🍈", vi: "Mít", en: "Jackfruit" },
};

export function cropLabelI18n(value: string, locale: Locale = "vi"): string {
  const entry = CROP_I18N[value];
  if (!entry) return value;
  return `${entry.emoji} ${locale === "en" ? entry.en : entry.vi}`;
}

export const CROP_VALUES = Object.keys(CROP_I18N);
