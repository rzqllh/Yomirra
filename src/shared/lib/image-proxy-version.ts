export const IMAGE_PROXY_VERSION = "2";

export function isCurrentImageProxyUrl(url: string): boolean {
  const prefix = "/api/proxy/image?";
  if (!url.startsWith(prefix)) return false;
  const params = new URLSearchParams(url.slice(prefix.length));
  return params.get("v") === IMAGE_PROXY_VERSION && Boolean(params.get("sig"));
}
