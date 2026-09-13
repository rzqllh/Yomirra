export type MangaKey = string; // SavedTitleId — legacy items use "sourceId::mangaId", new items use UUID

export type ReadingStatus = 
  | "reading" 
  | "completed" 
  | "on-hold" 
  | "dropped" 
  | "plan-to-read";

export interface Collection {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  sortOrder: number;
}

export interface CollectionState {
  collections: Collection[];
  // Mapping of MangaKey to an array of Collection IDs
  membershipsByManga: Record<MangaKey, string[]>;
  // Mapping of MangaKey to its reading status
  readingStatusByManga: Record<MangaKey, ReadingStatus>;
}
