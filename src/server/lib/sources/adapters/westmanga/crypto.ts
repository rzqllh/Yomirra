import crypto from "crypto";

export const WESTMANGA_DEFAULT_KEY = "WM_WEB_FRONT_END";
export const WESTMANGA_SALT = "xxxoidj";

/**
 * Computes the x-wm-request-signature required by WestManga API.
 * The signature is an HMAC-SHA256 of the constant message "wm-api-request".
 * The key format is: `${timestampSec}${method.toUpperCase()}${cleanPath}${accsesKey}${WESTMANGA_SALT}`
 * Note: `cleanPath` MUST NOT include any query strings (e.g., `/api/contents`, not `/api/contents?page=1`).
 */
export function generateWestMangaSignature(
  pathname: string,
  timestampSec: number,
  method = "GET",
  accsesKey = WESTMANGA_DEFAULT_KEY
): string {
  const message = "wm-api-request";
  const cleanPath = pathname.split("?")[0];
  const hmacKey = `${timestampSec}${method.toUpperCase()}${cleanPath}${accsesKey}${WESTMANGA_SALT}`;
  return crypto.createHmac("sha256", hmacKey).update(message).digest("hex");
}

export function getWestMangaHeaders(
  pathname: string,
  method = "GET",
  accsesKey = WESTMANGA_DEFAULT_KEY
): Record<string, string> {
  const timestampSec = Math.floor(Date.now() / 1000);
  const signature = generateWestMangaSignature(pathname, timestampSec, method, accsesKey);

  return {
    "x-wm-request-time": timestampSec.toString(),
    "x-wm-request-signature": signature,
    "x-wm-accses-key": accsesKey,
    Referer: "https://v1.westmanga.my/",
    Origin: "https://v1.westmanga.my",
    Accept: "application/json, text/plain, */*",
  };
}
