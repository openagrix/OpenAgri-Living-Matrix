import { describe, expect, it } from "vitest";
import {
  buildEvidencePayload,
  fromHex,
  hashEvidenceData,
  sha256,
  toHex,
  verifyEvidenceJson,
} from "./hash";

describe("buildEvidencePayload", () => {
  it("sorts top-level keys", () => {
    expect(buildEvidencePayload({ b: 1, a: 2 })).toBe('{"a":2,"b":1}');
  });

  it("sorts nested object keys at every depth", () => {
    const a = buildEvidencePayload({
      lot_id: "HONEY-1",
      sugar_profile: { fructose: 38, glucose: 31 },
    });
    const b = buildEvidencePayload({
      sugar_profile: { glucose: 31, fructose: 38 },
      lot_id: "HONEY-1",
    });
    expect(a).toBe(b);
  });

  it("sorts keys inside objects nested in arrays", () => {
    const a = buildEvidencePayload({ plots: [{ id: "P1", ha: 2 }] });
    const b = buildEvidencePayload({ plots: [{ ha: 2, id: "P1" }] });
    expect(a).toBe(b);
  });

  it("keeps array order meaningful", () => {
    const a = buildEvidencePayload({ crops: ["banana", "cocoa"] });
    const b = buildEvidencePayload({ crops: ["cocoa", "banana"] });
    expect(a).not.toBe(b);
  });

  it("preserves null without treating it as an object", () => {
    expect(buildEvidencePayload({ lab: null })).toBe('{"lab":null}');
  });

  it("NFC-normalises Vietnamese strings before hashing", () => {
    const composed = "Ong d\u00fa";
    const decomposed = "Ong du\u0301";
    expect(composed).not.toBe(decomposed);
    expect(buildEvidencePayload({ name: composed })).toBe(
      buildEvidencePayload({ name: decomposed })
    );
  });
});

describe("hashEvidenceData", () => {
  it("gives identical digests for semantically identical data", async () => {
    const one = await hashEvidenceData({
      ph: 6.5,
      nutrients: { n: 45, p: 30 },
    });
    const two = await hashEvidenceData({
      nutrients: { p: 30, n: 45 },
      ph: 6.5,
    });
    expect(toHex(one)).toBe(toHex(two));
  });

  it("produces a 32-byte digest for the on-chain [u8; 32] field", async () => {
    const digest = await hashEvidenceData({ crop: "banana" });
    expect(digest).toHaveLength(32);
  });

  it("changes when a value changes", async () => {
    const before = await hashEvidenceData({ grade: "A" });
    const after = await hashEvidenceData({ grade: "B" });
    expect(toHex(before)).not.toBe(toHex(after));
  });
});

describe("verifyEvidenceJson", () => {
  it("accepts raw JSON whose canonical hash matches the on-chain hash", async () => {
    const onChain = await hashEvidenceData({ crop: "banana", grade: "A" });
    const result = await verifyEvidenceJson(
      '{"grade":"A","crop":"banana"}',
      Array.from(onChain)
    );
    expect(result.ok).toBe(true);
    expect(result.computedHex).toBe(result.onChainHex);
  });

  it("rejects tampered data", async () => {
    const onChain = await hashEvidenceData({ crop: "banana", grade: "A" });
    const result = await verifyEvidenceJson(
      '{"crop":"banana","grade":"B"}',
      Array.from(onChain)
    );
    expect(result.ok).toBe(false);
  });

  it("throws on malformed JSON so the UI can flag it", async () => {
    const onChain = await hashEvidenceData({ crop: "banana" });
    await expect(verifyEvidenceJson("{not json", onChain)).rejects.toThrow();
  });
});

describe("hex helpers", () => {
  it("round-trips bytes", async () => {
    const digest = await sha256("openagri");
    expect(fromHex(toHex(digest))).toEqual(digest);
  });

  it("pads single-digit bytes", () => {
    expect(toHex(new Uint8Array([0, 15, 255]))).toBe("000fff");
  });
});
