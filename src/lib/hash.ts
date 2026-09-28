/**
 * Hash utilities for OpenAgriX evidence data.
 * We use SHA-256 to create a deterministic fingerprint of the off-chain data.
 * The hash is stored on-chain; the raw data can be stored on IPFS.
 */

/**
 * Compute SHA-256 hash of a string using the Web Crypto API.
 * Returns a Uint8Array[32] suitable for the Anchor program's [u8; 32] field.
 */
export async function sha256(input: string): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return new Uint8Array(hashBuffer);
}

/**
 * Convert a Uint8Array to a hex string for display.
 */
export function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Convert a hex string back to Uint8Array.
 */
export function fromHex(hex: string): Uint8Array {
  const result = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    result[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return result;
}

/**
 * Recursively sort object keys so semantically identical data always produces
 * the same string. Arrays keep their order (order is meaningful in a payload);
 * only object keys are normalised. Strings are NFC-normalised so Vietnamese
 * diacritics hash the same regardless of input form.
 *
 * Exported so the CRE workflow copy in `cre/ong-du-farm/lib` can be locked
 * against this exact algorithm by a cross-test.
 */
export function canonicalize(value: unknown): unknown {
  if (typeof value === "string") return value.normalize("NFC");
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value === null || typeof value !== "object") return value;

  const source = value as Record<string, unknown>;
  return Object.keys(source)
    .sort()
    .reduce<Record<string, unknown>>((acc, key) => {
      acc[key] = canonicalize(source[key]);
      return acc;
    }, {});
}

/**
 * Build a canonical evidence JSON string for hashing.
 *
 * Determinism matters more here than anywhere else in the product: the on-chain
 * dataHash is only meaningful if a buyer re-hashing the same off-chain JSON
 * lands on the exact same digest. Nested keys are sorted at every depth, so
 * `{a:{y:1,x:2}}` and `{a:{x:2,y:1}}` hash identically.
 */
export function buildEvidencePayload(data: Record<string, unknown>): string {
  return JSON.stringify(canonicalize(data));
}

/**
 * Hash of the canonical form of an evidence JSON object.
 * Used both when submitting and when a buyer re-verifies raw data.
 */
export async function hashEvidenceData(
  data: Record<string, unknown>
): Promise<Uint8Array> {
  return sha256(buildEvidencePayload(data));
}

/**
 * Re-hash raw JSON text and compare against a hash stored on-chain.
 * Returns the computed hex so the UI can show both sides of the comparison.
 */
export async function verifyEvidenceJson(
  rawJson: string,
  onChainHash: Uint8Array | number[]
): Promise<{ ok: boolean; computedHex: string; onChainHex: string }> {
  const parsed = JSON.parse(rawJson) as Record<string, unknown>;
  const computed = await hashEvidenceData(parsed);
  const computedHex = toHex(computed);
  const onChainHex = toHex(
    onChainHash instanceof Uint8Array ? onChainHash : new Uint8Array(onChainHash)
  );
  return { ok: computedHex === onChainHex, computedHex, onChainHex };
}
