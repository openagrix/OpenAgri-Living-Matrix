/**
 * Ong dú Win's Farm — Phase 0 lab fixture and scoring.
 *
 * The CRE workflow keeps a WASM-safe copy of the same algorithms in
 * `cre/ong-du-farm/lib`. A cross-test locks the two copies together.
 *
 * Numbers in the hashed payload are strings so JSON float encoding cannot
 * drift between the Next.js app and the CRE WASM runtime.
 */

export const ONG_DU_FARM_ID = "ong-du-wins-farm";
export const ONG_DU_LOT_ID = "HONEY-2026-08";
export const ONG_DU_REGION_CODE = "VN-TG";

export const VOLATILE_LAB_KEYS = new Set([
  "servedAt",
  "requestId",
  "authorization",
  "traceId",
]);

export type HoneyAssay = {
  lot_id: string;
  species: string;
  moisture_percent: string;
  hmf_mg_per_kg: string;
  diastase_number: string;
  color: string;
  sugar_profile: { fructose: string; glucose: string };
  lab: string;
  sampledAt: number;
};

export type HoneyPolicy = {
  maxMoisturePercent: number;
  maxHmfMgPerKg: number;
  minDiastaseNumber: number;
  requiredSpecies: string;
};

export type Verdict = "PASS" | "FAIL" | "MANUAL_REVIEW";

export const DEMO_HONEY_POLICY: HoneyPolicy = {
  maxMoisturePercent: 20,
  maxHmfMgPerKg: 40,
  minDiastaseNumber: 8,
  requiredSpecies: "stingless_bee",
};

/** Stable lab report — no volatile fields. This is what gets hashed. */
export const ONG_DU_STABLE_REPORT = {
  assay: {
    color: "light_amber",
    diastase_number: "14",
    hmf_mg_per_kg: "12",
    lab: "Trung tam Kiem dinh Nong san",
    lot_id: ONG_DU_LOT_ID,
    moisture_percent: "18.5",
    sampledAt: 1756684800,
    species: "stingless_bee",
    sugar_profile: {
      fructose: "38",
      glucose: "31",
    },
  } satisfies HoneyAssay,
  event: {
    destinationChain: "solana",
    kind: "lot_attestation",
    note: "Same promotional lot Win's Farm planned to announce on BNB; OpenAgriX attests it on Solana.",
    title: "Win's Farm — on-chain honey lot HONEY-2026-08",
  },
  farm: {
    gps: {
      lat: "10.412300",
      lng: "106.345600",
    },
    id: ONG_DU_FARM_ID,
    livingLab: "kim-long",
    name: "Ong du Win's Farm",
    nationalId: "0790-DEMO-0001",
    ownerFullName: "Nguyen Van Demo",
  },
  reportId: ONG_DU_LOT_ID,
} as const;

export function stripVolatileFields(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripVolatileFields);
  if (value === null || typeof value !== "object") return value;

  const source = value as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(source)) {
    if (VOLATILE_LAB_KEYS.has(key)) continue;
    out[key] = stripVolatileFields(source[key]);
  }
  return out;
}

export function evaluateHoney(
  assay: HoneyAssay,
  policy: HoneyPolicy
): { verdict: Verdict; grade: string; reasonCode: number } {
  if (assay.species !== policy.requiredSpecies) {
    return { verdict: "FAIL", grade: "F", reasonCode: 1001 };
  }

  const moisture = Number(assay.moisture_percent);
  const hmf = Number(assay.hmf_mg_per_kg);
  const diastase = Number(assay.diastase_number);

  if (!Number.isFinite(moisture) || !Number.isFinite(hmf) || !Number.isFinite(diastase)) {
    return { verdict: "FAIL", grade: "F", reasonCode: 1000 };
  }
  if (moisture > policy.maxMoisturePercent) {
    return { verdict: "FAIL", grade: "C", reasonCode: 1002 };
  }
  if (hmf > policy.maxHmfMgPerKg) {
    return { verdict: "FAIL", grade: "C", reasonCode: 1003 };
  }
  if (diastase < policy.minDiastaseNumber) {
    return { verdict: "FAIL", grade: "C", reasonCode: 1004 };
  }
  if (moisture >= policy.maxMoisturePercent * 0.95) {
    return { verdict: "MANUAL_REVIEW", grade: "B", reasonCode: 2001 };
  }

  const grade =
    moisture <= 19 && hmf <= 20 && diastase >= 12 ? "A" : "B";
  return { verdict: "PASS", grade, reasonCode: 0 };
}

export type PublicAttestation = {
  farmId: string;
  lotId: string;
  eventKind: string;
  dataHashHex: string;
  verdict: Verdict;
  grade: string;
  reasonCode: number;
  regionCode: string;
  attestedAt: number;
  destinationChain: "solana";
};

export function toPublicAttestation(
  stable: typeof ONG_DU_STABLE_REPORT | Record<string, unknown>,
  dataHashHex: string,
  scored: { verdict: Verdict; grade: string; reasonCode: number }
): PublicAttestation {
  const report = stable as typeof ONG_DU_STABLE_REPORT;
  return {
    farmId: report.farm.id,
    lotId: report.assay.lot_id,
    eventKind: report.event.kind,
    dataHashHex,
    verdict: scored.verdict,
    grade: scored.grade,
    reasonCode: scored.reasonCode,
    regionCode: ONG_DU_REGION_CODE,
    attestedAt: report.assay.sampledAt,
    destinationChain: "solana",
  };
}
