import { PublicKey } from "@solana/web3.js";

// ─── Evidence Types ──────────────────────────────────────────────────────────

export type EvidenceTypeKey =
  | "Harvest"
  | "Soil"
  | "Carbon"
  | "Water"
  | "Biodiversity"
  | "HoneyQuality"
  | "ProduceQuality";

export const EVIDENCE_TYPE_MAP: Record<
  EvidenceTypeKey,
  { label: string; labelVi: string; icon: string; color: string; unit: string }
> = {
  Harvest: {
    label: "Harvest",
    labelVi: "Thu Hoạch",
    icon: "🌾",
    color: "text-yellow-700 bg-yellow-50 border-yellow-200",
    unit: "kg",
  },
  Soil: {
    label: "Soil Test",
    labelVi: "Kiểm Tra Đất",
    icon: "🌍",
    color: "text-amber-700 bg-amber-50 border-amber-200",
    unit: "pH",
  },
  Carbon: {
    label: "Carbon",
    labelVi: "Carbon",
    icon: "🌎",
    color: "text-green-700 bg-green-50 border-green-200",
    unit: "kgCO2eq",
  },
  Water: {
    label: "Water",
    labelVi: "Nước",
    icon: "💧",
    color: "text-blue-700 bg-blue-50 border-blue-200",
    unit: "L",
  },
  Biodiversity: {
    label: "Biodiversity",
    labelVi: "Đa Dạng Sinh Học",
    icon: "🐝",
    color: "text-purple-700 bg-purple-50 border-purple-200",
    unit: "species",
  },
  HoneyQuality: {
    label: "Honey Quality",
    labelVi: "Chất lượng mật",
    icon: "🍯",
    color: "text-orange-700 bg-orange-50 border-orange-200",
    unit: "score",
  },
  ProduceQuality: {
    label: "Produce Quality",
    labelVi: "Chất lượng nông sản",
    icon: "🍎",
    color: "text-rose-700 bg-rose-50 border-rose-200",
    unit: "score",
  },
};

// ─── On-chain Account Shapes ─────────────────────────────────────────────────

export interface FarmProfileAccount {
  owner: PublicKey;
  farmId: string;
  name: string;
  location: string;
  cropTypes: string;
  areaM2: number;
  createdAt: number; // BN → number
  evidenceCount: number;
  bump: number;
}

export interface EvidenceRecordAccount {
  farm: PublicKey;
  submitter: PublicKey;
  evidenceType: { harvest?: {} } | { soil?: {} } | { carbon?: {} } | { water?: {} } | { biodiversity?: {} } | { honeyQuality?: {} } | { produceQuality?: {} };
  dataHash: number[]; // [u8; 32]
  ipfsCid: string;
  summary: string;
  quantity: number; // BN → number
  unit: string;
  eventTimestamp: number;
  submittedAt: number;
  sequence: number;
  bump: number;
}

// ─── UI-level types ───────────────────────────────────────────────────────────

export interface FarmWithPubkey {
  publicKey: PublicKey;
  account: FarmProfileAccount;
}

export interface EvidenceWithPubkey {
  publicKey: PublicKey;
  account: EvidenceRecordAccount;
  txSignature?: string;
}

// ─── Form input types ─────────────────────────────────────────────────────────

export interface RegisterFarmForm {
  farmId: string;
  name: string;
  location: string;
  cropTypes: string[];
  areaM2: number;
}

export interface SubmitEvidenceForm {
  evidenceType: EvidenceTypeKey;
  summary: string;
  quantity: number;
  unit: string;
  eventDate: string; // ISO date string
  rawData: string;   // JSON string to be hashed
  ipfsCid: string;   // optional IPFS CID (can be empty / mock)
}
