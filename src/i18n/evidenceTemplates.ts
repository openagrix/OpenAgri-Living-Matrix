import type { EvidenceTypeKey } from "@/types/openagri";
import type { Locale } from "./types";

export type EvidenceTemplate = {
  unit: string;
  quantityLabel: string;
  placeholderSummary: string;
  placeholderData: string;
};

const BASE_VI: Record<EvidenceTypeKey, EvidenceTemplate> = {
  Harvest: {
    unit: "kg",
    quantityLabel: "Sản lượng (kg)",
    placeholderSummary: "Thu hoạch chuối đợt 1 mùa mưa 2026",
    placeholderData: JSON.stringify(
      { crop: "banana", quality_grade: "A", plot_id: "P001", notes: "Thu hoạch đợt 1" },
      null,
      2
    ),
  },
  Soil: {
    unit: "pH",
    quantityLabel: "Chỉ số pH × 10 (VD: 65 = pH 6.5)",
    placeholderSummary: "Kết quả kiểm tra đất quý 3/2026 — đạt chuẩn hữu cơ",
    placeholderData: JSON.stringify(
      { ph: 6.5, nitrogen_ppm: 45, phosphorus_ppm: 30, organic_matter_percent: 3.2, lab: "Trung tâm KHNN" },
      null,
      2
    ),
  },
  Carbon: {
    unit: "kgCO2eq",
    quantityLabel: "Lượng carbon hấp thụ (kgCO2eq)",
    placeholderSummary: "Ước tính hấp thụ carbon Q2/2026 — phương pháp IPCC Tier 1",
    placeholderData: JSON.stringify(
      { period: "2026-Q2", method: "area_based_ipcc_tier1", crop_types: ["banana", "cocoa"] },
      null,
      2
    ),
  },
  Water: {
    unit: "L",
    quantityLabel: "Lượng nước sử dụng (lít)",
    placeholderSummary: "Lượng nước tưới tháng 8/2026",
    placeholderData: JSON.stringify(
      { source: "rain_harvesting", irrigation_method: "drip", period: "2026-08" },
      null,
      2
    ),
  },
  Biodiversity: {
    unit: "species",
    quantityLabel: "Số loài ghi nhận",
    placeholderSummary: "Khảo sát đa dạng sinh học tháng 8/2026",
    placeholderData: JSON.stringify(
      { bee_colonies: 5, bird_species: 12, plant_species: 28, survey_method: "transect" },
      null,
      2
    ),
  },
  HoneyQuality: {
    unit: "score",
    quantityLabel: "Điểm chất lượng mật (0–100)",
    placeholderSummary: "Kiểm định chất lượng mật ong dú — lô HONEY-2026-08",
    placeholderData: JSON.stringify(
      {
        lot_id: "HONEY-2026-08",
        species: "stingless_bee",
        moisture_percent: 18.5,
        hmf_mg_per_kg: 12,
        diastase_number: 14,
        color: "light_amber",
        sugar_profile: { fructose: 38, glucose: 31 },
        lab: "Trung tâm Kiểm định Nông sản",
        grade: "A",
        notes: "Đạt tiêu chuẩn mật ong xuất khẩu",
      },
      null,
      2
    ),
  },
  ProduceQuality: {
    unit: "score",
    quantityLabel: "Điểm chất lượng nông sản (0–100)",
    placeholderSummary: "Kiểm định chất lượng nông sản lô PQ-2026-08 — grade A",
    placeholderData: JSON.stringify(
      {
        lot_id: "PQ-2026-08",
        crop: "banana",
        grade: "A",
        brix: 18.2,
        size_mm: 180,
        defect_rate_percent: 2.1,
        pesticide_residue: "below_mrl",
        appearance: "uniform_color",
        lab: "Trung tâm Kiểm định Nông sản",
        standard: "VietGAP",
        notes: "Đạt chuẩn xuất khẩu",
      },
      null,
      2
    ),
  },
};

const BASE_EN: Record<EvidenceTypeKey, EvidenceTemplate> = {
  Harvest: {
    unit: "kg",
    quantityLabel: "Yield / production (kg)",
    placeholderSummary: "Banana harvest batch 1, rainy season 2026",
    placeholderData: JSON.stringify(
      { crop: "banana", quality_grade: "A", plot_id: "P001", notes: "First harvest batch" },
      null,
      2
    ),
  },
  Soil: {
    unit: "pH",
    quantityLabel: "pH index × 10 (e.g. 65 = pH 6.5)",
    placeholderSummary: "Q3/2026 soil test — meets organic standard",
    placeholderData: JSON.stringify(
      { ph: 6.5, nitrogen_ppm: 45, phosphorus_ppm: 30, organic_matter_percent: 3.2, lab: "Agri science center" },
      null,
      2
    ),
  },
  Carbon: {
    unit: "kgCO2eq",
    quantityLabel: "Carbon sequestered amount (kgCO2eq)",
    placeholderSummary: "Q2/2026 carbon estimate — IPCC Tier 1",
    placeholderData: JSON.stringify(
      { period: "2026-Q2", method: "area_based_ipcc_tier1", crop_types: ["banana", "cocoa"] },
      null,
      2
    ),
  },
  Water: {
    unit: "L",
    quantityLabel: "Water volume used (liters)",
    placeholderSummary: "Irrigation water — August 2026",
    placeholderData: JSON.stringify(
      { source: "rain_harvesting", irrigation_method: "drip", period: "2026-08" },
      null,
      2
    ),
  },
  Biodiversity: {
    unit: "species",
    quantityLabel: "Species recorded",
    placeholderSummary: "Biodiversity survey — August 2026",
    placeholderData: JSON.stringify(
      { bee_colonies: 5, bird_species: 12, plant_species: 28, survey_method: "transect" },
      null,
      2
    ),
  },
  HoneyQuality: {
    unit: "score",
    quantityLabel: "Honey quality score (0–100)",
    placeholderSummary: "Stingless-bee honey QC — lot HONEY-2026-08",
    placeholderData: JSON.stringify(
      {
        lot_id: "HONEY-2026-08",
        species: "stingless_bee",
        moisture_percent: 18.5,
        hmf_mg_per_kg: 12,
        diastase_number: 14,
        color: "light_amber",
        sugar_profile: { fructose: 38, glucose: 31 },
        lab: "Produce QC lab",
        grade: "A",
        notes: "Meets export honey standard",
      },
      null,
      2
    ),
  },
  ProduceQuality: {
    unit: "score",
    quantityLabel: "Produce quality score (0–100)",
    placeholderSummary: "Produce QC lot PQ-2026-08 — grade A",
    placeholderData: JSON.stringify(
      {
        lot_id: "PQ-2026-08",
        crop: "banana",
        grade: "A",
        brix: 18.2,
        size_mm: 180,
        defect_rate_percent: 2.1,
        pesticide_residue: "below_mrl",
        appearance: "uniform_color",
        lab: "Produce QC lab",
        standard: "VietGAP",
        notes: "Meets export standard",
      },
      null,
      2
    ),
  },
};

const AGARWOOD_VI: Partial<Record<EvidenceTypeKey, EvidenceTemplate>> = {
  Harvest: {
    unit: "kg",
    quantityLabel: "Khối lượng trầm hương khai thác (kg)",
    placeholderSummary: "Khai thác trầm Lô A — HTX Dó bầu Bình Phước Q4/2029",
    placeholderData: JSON.stringify(
      {
        lot_id: "LOT-A-2026",
        harvest_date: "2029-12-10",
        tree_count: 850,
        raw_weight_kg: 4200,
        agarwood_weight_kg: 1250,
        species: "Aquilaria crassna",
        method: "induction_harvest",
        forest_product_declaration_hash: "<sha256_of_declaration_pdf>",
        notes: "Khai thác sau 36 tháng gây tạo",
      },
      null,
      2
    ),
  },
  Soil: {
    unit: "pH",
    quantityLabel: "pH đất × 10 (đất trồng Aquilaria)",
    placeholderSummary: "Kiểm tra đất vùng trồng Dó bầu — Lô A, Bình Phước",
    placeholderData: JSON.stringify(
      {
        lot_id: "LOT-A-2026",
        ph: 5.5,
        organic_matter_percent: 4.1,
        nitrogen_ppm: 38,
        soil_type: "laterite",
        suitable_for_aquilaria: true,
        lab: "Trung tâm Nông nghiệp Bình Phước",
        notes: "Đất phù hợp trồng Dó bầu — pH 5-6, thoát nước tốt",
      },
      null,
      2
    ),
  },
  Carbon: {
    unit: "kgCO2eq",
    quantityLabel: "Carbon hấp thụ rừng trồng (kgCO2eq)",
    placeholderSummary: "Hấp thụ carbon rừng Dó bầu Lô A-E — IPCC Tier 1 2026",
    placeholderData: JSON.stringify(
      {
        farm_id: "OPENAGRI-FARM-VN-2026-000001",
        species: "Aquilaria crassna",
        area_ha: 10,
        tree_count: 6000,
        age_years: 1,
        method: "ipcc_tier1_plantation",
        absorption_factor_tco2_per_ha_year: 5.2,
        period: "2026",
        notes: "Rừng trồng đủ điều kiện tín chỉ carbon VCS",
      },
      null,
      2
    ),
  },
  Biodiversity: {
    unit: "species",
    quantityLabel: "Số loài trong vùng trồng",
    placeholderSummary: "CITES species record — Aquilaria crassna — HTX Dó bầu",
    placeholderData: JSON.stringify(
      {
        cites_appendix: "II",
        species: "Aquilaria crassna",
        source: "ARTIFICIALLY_PROPAGATED",
        farm_registration_code: "<ma_co_so_trong_cites>",
        seed_lot_id: "SEED-VN-2026-000001",
        total_trees: 6000,
        lots: ["LOT-A-2026", "LOT-B-2026", "LOT-C-2026", "LOT-D-2026", "LOT-E-2026"],
        cites_document_hash: "<sha256_of_cites_registration_pdf>",
        notes: "Đã đăng ký mã số cơ sở CITES theo CITES Appendix II",
      },
      null,
      2
    ),
  },
  Water: {
    unit: "L",
    quantityLabel: "Lượng nước tưới (lít)",
    placeholderSummary: "Tưới nước Lô A Dó bầu — tháng 8/2026",
    placeholderData: JSON.stringify(
      {
        lot_id: "LOT-A-2026",
        irrigation_method: "drip",
        source: "borehole",
        period: "2026-08",
        notes: "Tưới nhỏ giọt — giảm 40% so với tưới phun",
      },
      null,
      2
    ),
  },
  HoneyQuality: {
    unit: "score",
    quantityLabel: "Điểm chất lượng mật (0–100)",
    placeholderSummary: "Chất lượng mật ong rừng / phụ trợ Dó bầu",
    placeholderData: JSON.stringify(
      {
        lot_id: "HONEY-DOBAU-2026",
        moisture_percent: 19,
        floral_source: "aquilaria_understory",
        grade: "B",
        notes: "Mật từ vùng đệm rừng trồng Aquilaria",
      },
      null,
      2
    ),
  },
  ProduceQuality: {
    unit: "score",
    quantityLabel: "Điểm chất lượng nông sản (0–100)",
    placeholderSummary: "Chất lượng sản phẩm phụ / nông sản kèm Dó bầu",
    placeholderData: JSON.stringify(
      {
        lot_id: "PQ-DOBAU-2026",
        product: "agarwood_chips",
        grade: "A",
        moisture_percent: 12,
        resin_content_percent: 8.5,
        notes: "Đạt chuẩn xuất khẩu CITES",
      },
      null,
      2
    ),
  },
};

const AGARWOOD_EN: Partial<Record<EvidenceTypeKey, EvidenceTemplate>> = {
  Harvest: {
    unit: "kg",
    quantityLabel: "Agarwood harvest weight (kg)",
    placeholderSummary: "Agarwood harvest Lot A — Binh Phuoc co-op Q4/2029",
    placeholderData: JSON.stringify(
      {
        lot_id: "LOT-A-2026",
        harvest_date: "2029-12-10",
        tree_count: 850,
        raw_weight_kg: 4200,
        agarwood_weight_kg: 1250,
        species: "Aquilaria crassna",
        method: "induction_harvest",
        forest_product_declaration_hash: "<sha256_of_declaration_pdf>",
        notes: "Harvest after 36 months of induction",
      },
      null,
      2
    ),
  },
  Soil: {
    unit: "pH",
    quantityLabel: "Soil pH × 10 (Aquilaria plantation)",
    placeholderSummary: "Soil test — agarwood Lot A, Binh Phuoc",
    placeholderData: JSON.stringify(
      {
        lot_id: "LOT-A-2026",
        ph: 5.5,
        organic_matter_percent: 4.1,
        nitrogen_ppm: 38,
        soil_type: "laterite",
        suitable_for_aquilaria: true,
        lab: "Binh Phuoc agri center",
        notes: "Suitable for Aquilaria — pH 5-6, well drained",
      },
      null,
      2
    ),
  },
  Carbon: {
    unit: "kgCO2eq",
    quantityLabel: "Plantation carbon sequestered (kgCO2eq)",
    placeholderSummary: "Agarwood plantation carbon Lots A–E — IPCC Tier 1 2026",
    placeholderData: JSON.stringify(
      {
        farm_id: "OPENAGRI-FARM-VN-2026-000001",
        species: "Aquilaria crassna",
        area_ha: 10,
        tree_count: 6000,
        age_years: 1,
        method: "ipcc_tier1_plantation",
        absorption_factor_tco2_per_ha_year: 5.2,
        period: "2026",
        notes: "Plantation eligible for VCS carbon credits",
      },
      null,
      2
    ),
  },
  Biodiversity: {
    unit: "species",
    quantityLabel: "Species in plantation area",
    placeholderSummary: "CITES species record — Aquilaria crassna",
    placeholderData: JSON.stringify(
      {
        cites_appendix: "II",
        species: "Aquilaria crassna",
        source: "ARTIFICIALLY_PROPAGATED",
        farm_registration_code: "<cites_facility_code>",
        seed_lot_id: "SEED-VN-2026-000001",
        total_trees: 6000,
        lots: ["LOT-A-2026", "LOT-B-2026", "LOT-C-2026", "LOT-D-2026", "LOT-E-2026"],
        cites_document_hash: "<sha256_of_cites_registration_pdf>",
        notes: "Registered under CITES Appendix II",
      },
      null,
      2
    ),
  },
  Water: {
    unit: "L",
    quantityLabel: "Irrigation water (liters)",
    placeholderSummary: "Irrigation Lot A agarwood — August 2026",
    placeholderData: JSON.stringify(
      {
        lot_id: "LOT-A-2026",
        irrigation_method: "drip",
        source: "borehole",
        period: "2026-08",
        notes: "Drip irrigation — 40% less than spray",
      },
      null,
      2
    ),
  },
  HoneyQuality: {
    unit: "score",
    quantityLabel: "Honey quality score (0–100)",
    placeholderSummary: "Forest / buffer-zone honey near agarwood",
    placeholderData: JSON.stringify(
      {
        lot_id: "HONEY-DOBAU-2026",
        moisture_percent: 19,
        floral_source: "aquilaria_understory",
        grade: "B",
        notes: "Honey from Aquilaria plantation buffer zone",
      },
      null,
      2
    ),
  },
  ProduceQuality: {
    unit: "score",
    quantityLabel: "Produce quality score (0–100)",
    placeholderSummary: "By-product / companion produce quality — agarwood",
    placeholderData: JSON.stringify(
      {
        lot_id: "PQ-DOBAU-2026",
        product: "agarwood_chips",
        grade: "A",
        moisture_percent: 12,
        resin_content_percent: 8.5,
        notes: "Meets CITES export standard",
      },
      null,
      2
    ),
  },
};

export function isAgarwoodCropTypes(cropTypes: string): boolean {
  const s = cropTypes.toLowerCase();
  return (
    s.includes("agarwood") ||
    s.includes("dobau") ||
    s.includes("dó bầu") ||
    s.includes("aquilaria")
  );
}

export function getEvidenceTemplates(
  locale: Locale,
  cropTypes: string
): Record<EvidenceTypeKey, EvidenceTemplate> {
  const base = locale === "en" ? BASE_EN : BASE_VI;
  if (!isAgarwoodCropTypes(cropTypes)) return base;
  const overlay = locale === "en" ? AGARWOOD_EN : AGARWOOD_VI;
  return {
    Harvest: overlay.Harvest ?? base.Harvest,
    Soil: overlay.Soil ?? base.Soil,
    Carbon: overlay.Carbon ?? base.Carbon,
    Water: overlay.Water ?? base.Water,
    Biodiversity: overlay.Biodiversity ?? base.Biodiversity,
    HoneyQuality: overlay.HoneyQuality ?? base.HoneyQuality,
    ProduceQuality: overlay.ProduceQuality ?? base.ProduceQuality,
  };
}
