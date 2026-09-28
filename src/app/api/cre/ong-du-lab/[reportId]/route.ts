import { NextResponse } from "next/server";
import { ONG_DU_LOT_ID, ONG_DU_STABLE_REPORT } from "@/lib/cre/ongDuHoney";

/**
 * Mock lab API for Ong dú Win's Farm — Phase 0.
 *
 * The CRE confidential workflow calls this from inside the TEE with a Bearer
 * token. The full report (PII, GPS, assay) stays in the enclave; only hash +
 * verdict leave. Volatile fields are added on every response so consensus
 * must strip them before hashing.
 *
 * Demo token defaults to a public Phase 0 value. Override with CRE_LAB_API_TOKEN
 * before pointing a live workflow at a deployed URL.
 */
const DEMO_TOKEN = "openagri-ong-du-lab-demo";

function authorized(request: Request): boolean {
  const expected = process.env.CRE_LAB_API_TOKEN ?? DEMO_TOKEN;
  const header = request.headers.get("authorization") ?? "";
  return header === `Bearer ${expected}`;
}

export async function GET(
  request: Request,
  context: { params: { reportId: string } }
) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const reportId = context.params.reportId;
  if (reportId !== ONG_DU_LOT_ID) {
    return NextResponse.json({ error: "reportNotFound", reportId }, { status: 404 });
  }

  return NextResponse.json({
    ...ONG_DU_STABLE_REPORT,
    servedAt: new Date().toISOString(),
    requestId: `req-${Date.now()}`,
  });
}
