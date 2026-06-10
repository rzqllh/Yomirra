# Kontribusi / Contributing

Terima kasih sudah tertarik berkontribusi. Berikut panduan singkatnya.

---

## Setup Development

```bash
git clone https://github.com/rzqllh/Yomirra.git
cd Yomirra
pnpm install
cp .env.example .env
# Isi variabel di .env
pnpm dev
```

## Workflow

1. Fork repo ini
2. Buat branch dari `main`: `git checkout -b feat/nama-fitur`
3. Tulis kode
4. Pastikan lolos: `pnpm typecheck && pnpm lint`
5. Commit dengan format [Conventional Commits](https://www.conventionalcommits.org/):
   ```
   feat(reader): add double-tap zoom
   fix(search): handle empty query
   refactor(store): extract sync logic
   ```
6. Push dan buat Pull Request

## Aturan

- **TypeScript strict.** `any` tidak diterima kecuali ada alasan teknis yang jelas.
- **Phosphor Icons.** Jangan tambah icon library lain.
- **Satu PR, satu concern.** Jangan campur fitur baru dengan refactor.
- **Jangan hapus fitur yang berjalan** tanpa diskusi di issue terlebih dahulu.
- **Aksesibilitas.** Semua tombol interaktif harus punya accessible name. Gunakan semantic HTML.

## Struktur Kode

| Folder | Isi |
|---|---|
| `src/components/ui/` | Primitif (Button, Dialog, Input) |
| `src/components/manga/` | Komponen domain manga |
| `src/components/reader/` | Komponen reader |
| `src/shared/store/` | Zustand stores |
| `src/server/lib/sources/adapters/` | Source adapters |

## Menambah Source Adapter Baru

1. Buat folder di `src/server/lib/sources/adapters/<nama>/`
2. Buat `index.ts` (fetcher), `normalizer.ts` (data mapping), `types.ts` (raw API types)
3. Daftarkan adapter di `adapters/index.ts`
4. Pastikan semua capability dideklarasikan dengan jujur

## Pertanyaan?

Buka issue. Tidak perlu formal — tulis apa adanya.
