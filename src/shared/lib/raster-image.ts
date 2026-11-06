const RASTER_IMAGE_TYPES = new Set([
  "image/apng", "image/avif", "image/bmp", "image/gif",
  "image/jpeg", "image/jpg", "image/png", "image/webp",
]);

export function rasterImageContentType(response: Response | undefined): string | undefined {
  if (!response?.ok) return undefined;
  const type = response.headers.get("content-type")?.split(";")[0].trim().toLowerCase();
  return type && RASTER_IMAGE_TYPES.has(type) ? type : undefined;
}
