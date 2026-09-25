/** Encrypted envelope returned by all KomikNesia API endpoints. */
export interface KomikNesiaEnvelope {
  status: boolean;
  encrypted: boolean;
  data: string; // base64 ciphertext when encrypted === true, raw JSON string otherwise
  time: number; // Unix timestamp — used for key derivation
}

/** Decrypted content shape for /contents and /manga list endpoints. */
export interface KomikNesiaListPayload {
  status?: boolean;
  data?: KomikNesiaItem[];
  manga?: KomikNesiaItem[];
  totalPages?: number;
  currentPage?: number;
  totalCount?: number;
}

export interface KomikNesiaPage {
  items: KomikNesiaItem[];
  totalPages: number;
}

export interface KomikNesiaItem {
  id?: number | string;
  title: string;
  slug: string;
  cover?: string;
  thumbnail?: string;
  status?: string;
  type?: string;
  genres?: string[] | KomikNesiaGenreRef[];
  description?: string;
  author?: string;
  artist?: string;
  rating?: number | string;
  totalChapters?: number;
  latestChapter?: KomikNesiaChapterRef;
  updatedAt?: string;
  createdAt?: string;
}

export interface KomikNesiaGenreRef {
  id?: number | string;
  name?: string;
  slug?: string;
}

export interface KomikNesiaChapterRef {
  id?: number | string;
  slug?: string;
  number?: number | string;
  title?: string;
  releasedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

/** Decrypted content for /manga/slug/{slug} detail endpoint. */
export interface KomikNesiaDetailPayload {
  status?: boolean;
  data?: KomikNesiaDetail;
}

export interface KomikNesiaDetail extends KomikNesiaItem {
  chapters?: KomikNesiaChapter[];
}

export interface KomikNesiaChapter {
  id?: number | string;
  slug?: string;
  number?: number | string;
  title?: string;
  releasedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

/** Decrypted content for /chapters/slug/{slug} pages endpoint. */
export interface KomikNesiaChapterPayload {
  status?: boolean;
  data?: {
    images?: string[];
    number?: number | string;
    title?: string;
    chapters?: KomikNesiaChapter[];
  };
}
