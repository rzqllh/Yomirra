/**
 * DoujinDesu client-side cipher reverse-engineered from upstream bundle.
 * Upstream employs an LCG-based keystream XOR-cipher rotated hourly.
 */
const SALT = "doujindesu-scrapers-cannot-read-this-super-secret-salt-2026-v2";
const ROTATION_WINDOW_MS = 3600000; // 1 hour

function generateKey(timestampIndex: number): string {
  const seed = `${SALT}_${timestampIndex}`;
  let hash = 0;
  for (let n = 0; n < seed.length; n++) {
    hash = (hash << 5) - hash + seed.charCodeAt(n);
    hash |= 0;
  }
  let key = "";
  let lcg = Math.abs(hash) || 123456789;
  for (let n = 0; n < 32; n++) {
    lcg = (lcg * 1664525 + 1013904223) % 4294967296;
    key += String.fromCharCode(33 + (lcg % 93));
  }
  return key;
}

export function getCandidateKeys(now: number = Date.now()): string[] {
  const index = Math.floor(now / ROTATION_WINDOW_MS);
  return [
    generateKey(index),
    generateKey(index - 1),
    generateKey(index + 1),
  ];
}

export function xorDecrypt(hexPayload: string, key: string): string {
  const bytes: number[] = [];
  for (let x = 0; x < hexPayload.length; x += 2) {
    const hex = hexPayload.substring(x, x + 2);
    if (!hex) break;
    bytes.push(parseInt(hex, 16));
  }
  const chars: string[] = [];
  const keyLen = key.length;
  let counter = 42;
  for (let x = 0; x < bytes.length; x++) {
    const byte = bytes[x];
    const keyChar = key.charCodeAt(x % keyLen);
    const decryptedByte = byte ^ keyChar ^ ((x * 13) & 255) ^ counter;
    chars.push(String.fromCharCode(decryptedByte & 255));
    counter = (counter + byte) % 256;
  }
  return chars.join("");
}

export function decryptDoujinPayload<T>(payload: unknown): T {
  if (typeof payload !== "object" || payload === null) {
    return payload as T;
  }

  const enc = (payload as Record<string, unknown>)._enc_resp_;
  if (typeof enc !== "string") {
    return payload as T;
  }

  const candidateKeys = getCandidateKeys();
  for (const key of candidateKeys) {
    try {
      const decryptedStr = xorDecrypt(enc, key);
      const uriDecoded = decodeURIComponent(decryptedStr);
      return JSON.parse(uriDecoded) as T;
    } catch {
      // Try next key window
    }
  }

  throw new Error("DOUJINDESU_DECRYPT_FAILED: Failed to decrypt payload with current key candidates");
}
