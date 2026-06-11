import { createHmac } from "crypto";
import { env } from "@/env";

export function signImageUrl(url: string, referer?: string): string {
  if (!url) return "";
  
  const hmac = createHmac("sha256", env.IMAGE_PROXY_SECRET);
  hmac.update(url);
  if (referer) {
    hmac.update(referer);
  }
  const signature = hmac.digest("hex");

  const searchParams = new URLSearchParams();
  searchParams.set("url", url);
  searchParams.set("sig", signature);
  if (referer) {
    searchParams.set("ref", referer);
  }

  return `/api/proxy/image?${searchParams.toString()}`;
}

export function verifyImageUrl(url: string, signature: string, referer?: string): boolean {
  if (!url || !signature) return false;

  const hmac = createHmac("sha256", env.IMAGE_PROXY_SECRET);
  hmac.update(url);
  if (referer) {
    hmac.update(referer);
  }
  const expectedSignature = hmac.digest("hex");
  
  return signature === expectedSignature;
}
