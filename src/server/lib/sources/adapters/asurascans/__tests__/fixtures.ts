import type {
  AsuraChapterReadResponse,
  AsuraChaptersResponse,
  AsuraGenresResponse,
  AsuraSeriesDetailResponse,
  AsuraSeriesListResponse,
} from "../types";

export const mockAsuraSeriesList: AsuraSeriesListResponse = {
  data: [
    {
      id: 6090,
      slug: "war-of-extinction",
      title: "War of Extinction",
      description: "<p>Heavenly Demons. Hunters. Giant robots.</p><p>With video-game powers...</p>",
      cover: "https://cdn.asurascans.com/asura-images/covers/war-of-extinction.f60b25.webp",
      status: "ongoing",
      type: "manhwa",
      popularity_rank: 140,
      bookmark_count: 8598,
      rating: 8.63,
      chapter_count: 7,
      last_chapter_at: "2026-09-17T07:07:39.113767Z",
      is_pinned: true,
      genres: [
        { id: 1, name: "Action", slug: "action" },
        { id: 4, name: "Adventure", slug: "adventure" },
        { id: 16, name: "Fantasy", slug: "fantasy" },
      ],
      latest_chapters: [
        {
          id: 261529,
          number: 7,
          slug: "chapter-7",
          page_count: 34,
          is_premium: false,
          published_at: "2026-09-17T07:07:39.113767Z",
        },
      ],
    },
    {
      id: 1968,
      slug: "the-return-of-the-crazy-demon",
      title: "The Return of the Crazy Demon",
      description: "<p>The Mad Demon Yi Zaha...</p>",
      cover: "https://cdn.asurascans.com/asura-images/covers/crazy-demon.webp",
      status: "completed",
      type: "manhwa",
      popularity_rank: 5,
      bookmark_count: 95000,
      rating: 9.8,
      chapter_count: 214,
      last_chapter_at: "2026-09-19T01:00:00Z",
      latest_chapters: [
        {
          id: 261530,
          number: 214,
          slug: "chapter-214",
          is_premium: true,
          published_at: "2026-09-19T01:00:00Z",
        },
      ],
    },
  ],
  meta: {
    total: 348,
    per_page: 20,
    has_more: true,
  },
};

export const mockAsuraSeriesDetail: AsuraSeriesDetailResponse = {
  series: {
    id: 6090,
    slug: "war-of-extinction",
    title: "War of Extinction",
    description: "<p>Heavenly Demons. Hunters. Giant robots.</p><p>With video-game powers &amp; abilities.</p>",
    cover: "https://cdn.asurascans.com/asura-images/covers/war-of-extinction.f60b25.webp",
    status: "ongoing",
    type: "manhwa",
    popularity_rank: 140,
    bookmark_count: 8598,
    rating: 8.63,
    chapter_count: 7,
    last_chapter_at: "2026-09-17T07:07:39.113767Z",
    genres: [
      { id: 1, name: "Action", slug: "action" },
      { id: 4, name: "Adventure", slug: "adventure" },
      { id: 16, name: "Fantasy", slug: "fantasy" },
    ],
  },
};

export const mockAsuraChapters: AsuraChaptersResponse = {
  data: [
    {
      id: 261529,
      series_id: 6090,
      number: 7,
      slug: "chapter-7",
      page_count: 34,
      is_premium: false,
      is_locked: false,
      published_at: "2026-09-17T07:07:39.113767Z",
      series_slug: "war-of-extinction",
    },
    {
      id: 261528,
      series_id: 6090,
      number: 6,
      slug: "chapter-6",
      page_count: 30,
      is_premium: false,
      is_locked: false,
      published_at: "2026-09-17T06:29:40.045586Z",
      series_slug: "war-of-extinction",
    },
    {
      id: 261530,
      series_id: 6090,
      number: 8,
      slug: "chapter-8",
      page_count: 0,
      is_premium: true,
      is_locked: true,
      early_access_until: "2099-01-01T00:00:00Z",
      published_at: "2026-09-19T01:00:00Z",
      series_slug: "war-of-extinction",
    },
  ],
};

export const mockAsuraUnlockedPages: AsuraChapterReadResponse = {
  data: {
    is_locked: false,
    chapter: {
      id: 261529,
      series_id: 6090,
      number: 7,
      slug: "chapter-7",
      pages: [
        {
          url: "https://cdn.asurascans.com/asura-images/chapters/war-of-extinction/7/001.webp",
          width: 1532,
          height: 1024,
        },
        {
          url: "https://cdn.asurascans.com/asura-images/chapters/war-of-extinction/7/002.webp",
          width: 1532,
          height: 1024,
        },
      ],
    },
  },
};

export const mockAsuraLockedPages: AsuraChapterReadResponse = {
  data: {
    is_locked: true,
    unlock_time: "2099-01-01T00:00:00Z",
    chapter: null,
  },
};

export const mockAsuraGenres: AsuraGenresResponse = {
  data: [
    { id: 1, name: "Action", slug: "action" },
    { id: 4, name: "Adventure", slug: "adventure" },
    { id: 16, name: "Fantasy", slug: "fantasy" },
  ],
};
