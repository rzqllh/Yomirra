export interface MangaTransitionNames {
  card: string;
  cover: string;
  title: string;
}

export function getMangaTransitionNames(
  sourceId: string,
  mangaId: string
): MangaTransitionNames {
  const safeId = `${sourceId}-${mangaId}`.replace(/[^a-zA-Z0-9-]/g, "-");

  return {
    card: `manga-card-${safeId}`,
    cover: `manga-cover-${safeId}`,
    title: `manga-title-${safeId}`,
  };
}
