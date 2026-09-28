import { describe, expect, it } from "vitest";
import { buildEvidencePayload, hashEvidenceData, toHex } from "../hash";
import {
  DEMO_HONEY_POLICY,
  ONG_DU_STABLE_REPORT,
  evaluateHoney,
  stripVolatileFields,
} from "./ongDuHoney";

describe("Ong Du honey lot — hash lock against CRE", () => {
  it("canonical JSON is key-order independent", () => {
    const a = buildEvidencePayload(ONG_DU_STABLE_REPORT);
    const shuffled = {
      reportId: ONG_DU_STABLE_REPORT.reportId,
      farm: {
        nationalId: ONG_DU_STABLE_REPORT.farm.nationalId,
        name: ONG_DU_STABLE_REPORT.farm.name,
        gps: {
          lng: ONG_DU_STABLE_REPORT.farm.gps.lng,
          lat: ONG_DU_STABLE_REPORT.farm.gps.lat,
        },
        livingLab: ONG_DU_STABLE_REPORT.farm.livingLab,
        id: ONG_DU_STABLE_REPORT.farm.id,
        ownerFullName: ONG_DU_STABLE_REPORT.farm.ownerFullName,
      },
      event: {
        title: ONG_DU_STABLE_REPORT.event.title,
        destinationChain: ONG_DU_STABLE_REPORT.event.destinationChain,
        kind: ONG_DU_STABLE_REPORT.event.kind,
        note: ONG_DU_STABLE_REPORT.event.note,
      },
      assay: {
        sugar_profile: {
          glucose: ONG_DU_STABLE_REPORT.assay.sugar_profile.glucose,
          fructose: ONG_DU_STABLE_REPORT.assay.sugar_profile.fructose,
        },
        lot_id: ONG_DU_STABLE_REPORT.assay.lot_id,
        species: ONG_DU_STABLE_REPORT.assay.species,
        moisture_percent: ONG_DU_STABLE_REPORT.assay.moisture_percent,
        sampledAt: ONG_DU_STABLE_REPORT.assay.sampledAt,
        hmf_mg_per_kg: ONG_DU_STABLE_REPORT.assay.hmf_mg_per_kg,
        lab: ONG_DU_STABLE_REPORT.assay.lab,
        diastase_number: ONG_DU_STABLE_REPORT.assay.diastase_number,
        color: ONG_DU_STABLE_REPORT.assay.color,
      },
    };
    expect(buildEvidencePayload(shuffled)).toBe(a);
  });

  it("volatile lab envelope fields do not change the digest", async () => {
    const stable = await hashEvidenceData(ONG_DU_STABLE_REPORT);
    const wrapped = stripVolatileFields({
      ...ONG_DU_STABLE_REPORT,
      servedAt: "2026-09-06T02:00:00.000Z",
      requestId: "req-volatile-1",
    }) as typeof ONG_DU_STABLE_REPORT;
    const afterStrip = await hashEvidenceData(wrapped);
    expect(toHex(afterStrip)).toBe(toHex(stable));
  });

  it("demo lot passes the private buyer policy with grade A", () => {
    expect(evaluateHoney(ONG_DU_STABLE_REPORT.assay, DEMO_HONEY_POLICY)).toEqual({
      verdict: "PASS",
      grade: "A",
      reasonCode: 0,
    });
  });

  it("locks the digest the CRE simulator produced for HONEY-2026-08", async () => {
    const digest = await hashEvidenceData(ONG_DU_STABLE_REPORT);
    expect(digest).toHaveLength(32);
    expect(toHex(digest)).toBe(
      "6982dbbdb4703000db9374149a2a00e860db0ac32fbb0509165c5ec95077c3f4"
    );
  });
});
