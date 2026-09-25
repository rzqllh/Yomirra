import type { KomikNesiaEnvelope } from "../types";
import type {
  KomikNesiaListPayload,
  KomikNesiaDetailPayload,
  KomikNesiaChapterPayload,
} from "../types";

/**
 * All encrypted fixtures were generated with:
 *   TEST_TIME = 1789751534
 *   KEY_STR   = "55929735.43750000000000000000000" (32 UTF-8 bytes)
 *   IV        = Buffer.alloc(16, 0x42)  — fixed for determinism
 *
 * The generator script is at:
 *   .gemini/antigravity-ide/brain/.../scratch/gen_komiknesia_fixtures.js
 */
export const TEST_TIME = 1789751534;


export const encryptedListEnvelope: KomikNesiaEnvelope = {
  status: true,
  encrypted: true,
  data: "QkJCQkJCQkJCQkJCQkJCQnQ4wYFXK1yAoePU/TF+DcpR057K3/cW+cYESbqKybYEMuw++b2m0EbcD8iFnyDrpw+yKwf2HAry3HJ4ZrdeLhDP7BQxipX2J+n4h+eaKHBiBjveDPbn8Xi+EA/iGt5BQTmFZ1qTgJCKYKEt0wqFWGMafjQlcyF3iVYUDuUK+ZPdXYw9FSZvSY72uaJDqHgCDQy5SNO6wfXJLFh8B5euUnEb3v0AGfxip7F6JbTWzFJ8fmA+UiFbfwBepGL+HJ7kAW+kNGvf5IrL58/E0qXAle6e9kF/5qFwz/6PNKNJc5qcT/Ef7HUAMBVZGzAM2DIH2sr0dY9Ck+mXXAhbESKi2djCfyHsXoknyzKJeNgBn+NftCG6aGUwHOPyQF5cv22ulvM/64UNmvGZxc5DBb4QHhEfb65ah6pDhxFI0dq8zAh15oLQzDkMY/MFJy3L+OeSzpHEZJIttMV4a9psjagzLYEtuolgG4NLelXK6D9nqLgE1DldsZmozPQSg3XZmo7tCaGSGG1guRezqx80N5QuJxZ/XoGW7PXgJ3FhGbc0tNVdRrN47//Ki6zTKo0Y5wZcDu8qxgT73iEb6TEySOljOCS3noeEOkiaU4bdYpOgmLCtwfQNlvwsof4TcsoZx7+MHg==",
  time: TEST_TIME,
};

export const encryptedSearchEnvelope: KomikNesiaEnvelope = {
  status: true,
  encrypted: true,
  data: "QkJCQkJCQkJCQkJCQkJCQnQ4wYFXK1yAoePU/TF+DcruASu0/SithYipfAkZJR8Et6QYp+Osh7t/kYbOqCLgWvOXIVgesJcXKn2abM9BmyUJ6YLbUu/vc3lcHKqLhGGyJDwXUBsRO1vDXNJYBJgpkeoIVlpcv8NVmgGWKWIRkrUtfMw0abeQwbPBrLwVCf5iw0bE4Wbwr+ue4Wr53kXhOjd71YGIh4vgoGwJecOpnbOu78Xnx8PYiBL+KXEfA/JNGYZqKPUXRlJGA28fOcn+Rr5ddupdCuBkk4A9OCnpxUcweyaNf6z18AqgP3KolMPXcJUv4BRlnY3oiFqHvV2H78SxKpdDzh2nxGHPrsCI1R0=",
  time: TEST_TIME,
};

export const encryptedDetailEnvelope: KomikNesiaEnvelope = {
  status: true,
  encrypted: true,
  data: "QkJCQkJCQkJCQkJCQkJCQnQ4wYFXK1yAoePU/TF+DcpNn5Aped1icutf9HRZJ3sVGdwvSrJLYOTo3NEhZOTiWOPdywQkbBb/ZtlmgtDvgfzGGTbMz1yJZBffN1NRJkho6Lqo3DAtMTYS9E3bK/Yv2z4J1CT5koDwD+uktzIJhnJcpBkEk7kDpAA7S3tHXHW31Cye3uQ6UkWos/K9L9KPabuTWzI4VElUScgTvQ+fjQpg3S1wXsRfge3nXyINBnjWb9sOschtqzgduqhD/jnmFggSfqSRgu5B1MKN2bGRLHVOyDBJVveg69EByABzYiIroFzlB6/Y5U5ZIx9K/OkQT24WjdB2qEayrAHDHBNeBJcdXsos9WJ3/zCKvYi+qEuUHb7wFbpZznj4MxGe7gsTxlZtvQ6pjw1GEf6/AtvIDqQFqo+V0b7Kz4X8pdCsYdSnKb+THEGpHbdk35K2LugoYNFWs1pZLWdDoDh6TZS9XcguXxoVkkhCPHFtOYDyLgVZCz8vUXIVjNvCHqJJCtL+bBjJ4FFIbQhbDYhoY00NrTcbeNwTCA7bnVL3cZlvucHoOti9IwRJhmVjssNbgfjgmDCrrhI5qy2UmXSyLqweeDatounXR1AvvUXWQZNQ7IHAVtJRXA9cApuAqWDPH931YeSZjPKvELErvbzwGvFIUPryWmglE50BNgJydK3mTgKrl/3wf8UNW3UD5c9YGQGH4MA4MTD8qvGUK7oHCw24L+GYkYkDztTShL+2ko958yLmcIpMmrxx56rDa23Ve7mEt/1C+sTKVnQHWbs9ak26fMw8PYAhS2v2iqmuxznCeamdYaJ5rg7i+CVmaL4gtHXbSdPcPT7TVeRxJx8u5bVpWVO/qq4NhrB3PJGCBwAfCpj0ZzfPNyXDy7cuwf/UHuUKJz99064IeHVelVIU5uCqmAaEusvnw3luRzkz9E0uY/lNKv/0nWKukToScegY/+iRGg==",
  time: TEST_TIME,
};

export const encryptedPagesEnvelope: KomikNesiaEnvelope = {
  status: true,
  encrypted: true,
  data: "QkJCQkJCQkJCQkJCQkJCQnQ4wYFXK1yAoePU/TF+DcpqimBa8dq36QeZKFRDmTkv/l6Id57CS+R9WpfKGk2TiffUO4v7lH2JR4zZA6t3ezkHSmI6w3pQGD7+BZ/b/D5ooijMYU51fah+HdrZU4w0KOEK6rDAhLF9rOyuWC+1nvryakybR8cs28ts/2S348v3MCQb8HYTYQrPS4oZjF4D1v99DK0UQ1VAh+eencTImO60xZSS48RWGTbsqsFy72r2IgjVm2p6TLWZApMZY/3IlFTmrDCDNYakx8XoSb7DfwXl1TZr6/MkCR8WFCVxJ4uJn2+dr2frXu+VqaFsB9fpmkVgFF9zC3M8kJ2u8HOMc5w=",
  time: TEST_TIME,
};

export const encryptedEmptyListEnvelope: KomikNesiaEnvelope = {
  status: true,
  encrypted: true,
  data: "QkJCQkJCQkJCQkJCQkJCQnQ4wYFXK1yAoePU/TF+Dcr3Ay5bMPc9lJhSv4DYHcN1nvYhwriXlm2+oy6PN72AQ5ZPxX501P/rn0YNsJW0oU/cEOz85h1kqNvKJyVEcqCA",
  time: TEST_TIME,
};

/** Plaintext (non-encrypted) envelope — for testing the non-encrypted branch. */
export const plaintextEnvelope: KomikNesiaEnvelope = {
  status: true,
  encrypted: false,
  data: JSON.stringify({ status: true, data: [], totalPages: 0, currentPage: 1 }),
  time: TEST_TIME,
};


export const expectedListPayload: KomikNesiaListPayload = {
  status: true,
  data: [
    {
      id: 1,
      title: "Hantu Kerja",
      slug: "even-if-i-fall-into-a-ghost-story-i-still-have-to-go-to-work",
      cover: "https://data.cdnesia.my.id/covers/hantu-kerja.jpg",
      status: "ongoing",
      type: "manhwa",
      latestChapter: {
        number: 36,
        slug: "even-if-i-fall-into-a-ghost-story-i-still-have-to-go-to-work-chapter-36-bahasa-indonesia",
        releasedAt: "2024-01-10T00:00:00Z",
      },
      updatedAt: "2024-01-10T00:00:00Z",
    },
  ],
  totalPages: 5,
  currentPage: 1,
  totalCount: 100,
};

export const expectedDetailPayload: KomikNesiaDetailPayload = {
  status: true,
  data: {
    id: 1,
    title: "Hantu Kerja",
    slug: "even-if-i-fall-into-a-ghost-story-i-still-have-to-go-to-work",
    cover: "https://data.cdnesia.my.id/covers/hantu-kerja.jpg",
    status: "ongoing",
    type: "manhwa",
    description: "Sebuah cerita tentang hantu dan pekerjaan",
    author: "Author A",
    artist: "Artist B",
    genres: ["Action", "Comedy"],
    chapters: [
      {
        id: 1001,
        slug: "even-if-i-fall-into-a-ghost-story-i-still-have-to-go-to-work-chapter-36-bahasa-indonesia",
        number: 36,
        title: "Chapter 36",
        releasedAt: "2024-01-10T00:00:00Z",
      },
      {
        id: 1000,
        slug: "even-if-i-fall-into-a-ghost-story-i-still-have-to-go-to-work-chapter-35-bahasa-indonesia",
        number: 35,
        title: "Chapter 35",
        releasedAt: "2024-01-03T00:00:00Z",
      },
    ],
  },
};

export const currentDirectDetailPayload = {
  id: 1,
  title: "Hantu Kerja",
  slug: "even-if-i-fall-into-a-ghost-story-i-still-have-to-go-to-work",
  cover: "https://data.cdnesia.my.id/covers/hantu-kerja.jpg",
  status: "ongoing",
  content_type: "manhwa",
  synopsis: "Sebuah cerita tentang hantu dan pekerjaan",
  author: "Author A",
  artist: "Artist B",
  genres: ["Action", "Comedy"],
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-10T00:00:00Z",
  chapters: [
    {
      id: 1001,
      slug: "even-if-i-fall-into-a-ghost-story-i-still-have-to-go-to-work-chapter-36-bahasa-indonesia",
      chapter_number: "36",
      title: "Chapter 36",
      created_at: "2024-01-10T00:00:00Z",
    },
    {
      id: 1000,
      slug: "even-if-i-fall-into-a-ghost-story-i-still-have-to-go-to-work-chapter-35-bahasa-indonesia",
      chapter_number: "35",
      title: "Chapter 35",
      created_at: "2024-01-03T00:00:00Z",
    },
  ],
};

export const currentDirectDetailEnvelope: KomikNesiaEnvelope = {
  status: true,
  encrypted: false,
  data: JSON.stringify(currentDirectDetailPayload),
  time: TEST_TIME,
};

export const currentContentsEnvelope: KomikNesiaEnvelope = {
  status: true,
  encrypted: false,
  data: JSON.stringify({
    status: true,
    data: [
      {
        id: 1,
        title: "Hantu Kerja",
        slug: "even-if-i-fall-into-a-ghost-story-i-still-have-to-go-to-work",
        cover: "https://data.cdnesia.my.id/covers/hantu-kerja.jpg",
        status: "ongoing",
        content_type: "manhwa",
        sinopsis: "Sebuah cerita tentang hantu dan pekerjaan",
        lastChapters: [
          {
            number: "36",
            slug: "even-if-i-fall-into-a-ghost-story-i-still-have-to-go-to-work-chapter-36-bahasa-indonesia",
            created_at: { time: 1704844800 },
          },
        ],
      },
    ],
    meta: { page: 1, per_page: 20, total: 80, total_pages: 4 },
  }),
  time: TEST_TIME,
};

export const expectedPagesPayload: KomikNesiaChapterPayload = {
  status: true,
  data: {
    images: [
      "https://data.cdnesia.my.id/chapters/hantu-kerja/36/001.webp",
      "https://data.cdnesia.my.id/chapters/hantu-kerja/36/002.webp",
      "https://data.cdnesia.my.id/chapters/hantu-kerja/36/003.webp",
    ],
    number: 36,
    title: "Chapter 36",
  },
};
