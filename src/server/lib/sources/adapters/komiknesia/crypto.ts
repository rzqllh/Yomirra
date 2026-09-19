import crypto from "crypto";
import type { KomikNesiaEnvelope } from "./types";

/**
 * Derives the AES-256-CBC key from the response `time` field.
 *
 * Verified algorithm (from SOURCE_RESEARCH.md):
 *   let r = Number(time)
 *   for (let s = 0; s < 5; s++) r = r / 2
 *   let n = r.toFixed(8)
 *   key = n.padEnd(32, '0')
 *
 * The key is a UTF-8 string exactly 32 bytes long.
 */
export function deriveKey(time: number): Buffer {
  if (!Number.isFinite(time) || time <= 0) {
    throw new Error(`KOMIKNESIA_DECRYPT_FAILURE: Invalid time value for key derivation: ${time}`);
  }

  let r = Number(time);
  for (let s = 0; s < 5; s++) r = r / 2;
  const n = r.toFixed(8);
  const keyStr = n.padEnd(32, "0");

  return Buffer.from(keyStr, "utf8");
}

/**
 * Decrypts a KomikNesia AES-256-CBC encrypted payload.
 *
 * Envelope contract (VERIFIED_FROM_SOURCE):
 *   - `data` is a base64-encoded buffer: [16 bytes IV][N bytes ciphertext]
 *   - `time` drives key derivation
 *
 * Throws with distinct error codes for each failure stage:
 *   - KOMIKNESIA_DECRYPT_FAILURE: base64 decode, IV extraction, or AES errors
 *   - KOMIKNESIA_MALFORMED_JSON: decryption succeeded but result is not valid JSON
 */
export function decryptEnvelope(envelope: KomikNesiaEnvelope): unknown {
  if (!envelope.encrypted) {
    // Plaintext envelope — attempt direct JSON parse of data field
    try {
      return JSON.parse(envelope.data);
    } catch {
      throw new Error("KOMIKNESIA_MALFORMED_JSON: Non-encrypted envelope data is not valid JSON");
    }
  }

  let raw: Buffer;
  try {
    raw = Buffer.from(envelope.data, "base64");
  } catch {
    throw new Error("KOMIKNESIA_DECRYPT_FAILURE: Failed to base64-decode encrypted data");
  }

  if (raw.length < 17) {
    throw new Error(
      `KOMIKNESIA_DECRYPT_FAILURE: Encrypted data too short to contain IV (${raw.length} bytes)`
    );
  }

  const iv = raw.subarray(0, 16);
  const ciphertext = raw.subarray(16);

  let key: Buffer;
  try {
    key = deriveKey(envelope.time);
  } catch (e) {
    throw new Error(`KOMIKNESIA_DECRYPT_FAILURE: Key derivation failed — ${(e as Error).message}`);
  }

  let plaintext: string;
  try {
    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
    plaintext = decipher.update(ciphertext, undefined, "utf8") + decipher.final("utf8");
  } catch (e) {
    throw new Error(`KOMIKNESIA_DECRYPT_FAILURE: AES-256-CBC decryption failed — ${(e as Error).message}`);
  }

  try {
    return JSON.parse(plaintext);
  } catch {
    throw new Error(
      "KOMIKNESIA_MALFORMED_JSON: Decryption succeeded but result is not valid JSON"
    );
  }
}
