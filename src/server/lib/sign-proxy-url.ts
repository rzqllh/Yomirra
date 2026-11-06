import { createHmac, timingSafeEqual } from "crypto";
import { env } from "@/env";
import { IMAGE_PROXY_VERSION } from "@/shared/lib/image-proxy-version";

export function signImageUrl(url: string, referer?: string): string {
  if (!url) return "";
  if (!env.IMAGE_PROXY_SECRET) return url;

  const signature = imageSignature(env.IMAGE_PROXY_SECRET, url, referer).toString("hex");

  const searchParams = new URLSearchParams();
  searchParams.set("v", IMAGE_PROXY_VERSION);
  searchParams.set("url", url);
  searchParams.set("sig", signature);
  if (referer) {
    searchParams.set("ref", referer);
  }

  return `/api/proxy/image?${searchParams.toString()}`;
}

export function verifyImageUrl(url: string, signature: string, referer?: string): boolean {
  if (!url || signature.length !== 64 || /[^a-f0-9]/.test(signature) || !env.IMAGE_PROXY_SECRET) return false;

  return timingSafeEqual(Buffer.from(signature, "hex"), imageSignature(env.IMAGE_PROXY_SECRET, url, referer));
}

function imageSignature(secret: string, url: string, referer?: string): Buffer {
  return createHmac("sha256", secret)
    .update(JSON.stringify(["yomirra-image-v2", url, referer || null]))
    .digest();
}
