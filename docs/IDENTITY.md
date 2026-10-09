# Identity

Yomirra memisahkan identitas judul yang disimpan user dari identitas fisik judul pada satu source.

Tujuannya: Library dan progress tidak ikut rusak hanya karena source pindah domain, down, atau diganti.

## SavedTitleId

`SavedTitleId` adalah identity lokal yang durable untuk satu judul di Library.

- item lama dapat memakai bentuk legacy `sourceId::mangaId`;
- item baru dapat memakai UUID;
- setelah dibuat, ID diperlakukan sebagai opaque string;
- ID tidak berubah hanya karena primary source berubah.

## SourceRef

Satu SavedTitle dapat punya beberapa source reference.

```ts
type SourceRef = {
  sourceId: string;
  mangaId: string;
  addedAt: number;
  matchConfidence:
    | "CONFIRMED"
    | "HIGH_CONFIDENCE"
    | "AMBIGUOUS"
    | "NO_MATCH";
};
```

Library item menyimpan:

- `primarySourceId` + `primaryMangaId` untuk source baca aktif;
- `linkedSources` untuk alternate/previous source;
- legacy `sourceId` + `mangaId` untuk compatibility.

## Match confidence

| Nilai | Arti |
| --- | --- |
| `CONFIRMED` | link sudah dikonfirmasi/terverifikasi |
| `HIGH_CONFIDENCE` | heuristic kuat, tetap perlu keputusan user sebelum relink |
| `AMBIGUOUS` | kandidat belum aman |
| `NO_MATCH` | tidak cukup bukti |

Heuristic tidak boleh diam-diam mengubah match menjadi `CONFIRMED`.

## History

History tetap menyimpan provenance chapter fisik:

```text
sourceId + mangaId + chapterId
```

`HistoryItem.savedTitleId` adalah convenience link ke SavedTitle. Jika field ini tidak ada, Yomirra dapat mencoba resolve kembali melalui primary/linked source di Library.

History yang tidak bisa di-resolve tidak boleh dihapus hanya karena identity migration gagal.

Penghapusan Library/History yang disinkronkan menulis tombstone pada data cloud agar perangkat yang tertinggal tidak mengunggah ulang item lama. Delete menang pada timestamp yang sama, sedangkan re-add atau progress eksplisit dengan timestamp lebih baru dapat dipertahankan. Aturan ini tidak mengubah `SavedTitleId` yang opaque.

## Collections dan Updates

User-created collection membership menggunakan SavedTitle-compatible key.

Smart Collections berbeda: ia derived dari Library + History dan tidak menulis membership otomatis ke persisted collection state.

Bookmark harus ditambahkan secara eksplisit; rating dan membership koleksi tidak boleh otomatis membuat bookmark. Custom collections/membership dapat disinkronkan, sedangkan `readingStatusByManga` masih local-only.

## Source recovery

Saat primary source tidak bisa dipakai:

1. Yomirra mencari kandidat dari source yang layak.
2. Candidate dibandingkan menggunakan title/alternate title/author dan metadata yang tersedia.
3. Match ambigu tidak dipindah otomatis.
4. Setelah user memilih source baru, primary ref diperbarui.
5. Source lama tetap disimpan sebagai linked source.
6. Chapter progress hanya dipetakan bila mapping cukup aman; progress lama tetap dipertahankan jika tidak.

## Canonical search identity

Canonical result di Search bukan global permanent work ID. Ia adalah clustering identity untuk menggabungkan hasil source yang cukup yakin merepresentasikan judul yang sama.

Collision harus dipisahkan ketika title sama ternyata karya berbeda.

## Backup

Backup schema v3 membawa field identity v2 Library:

- `id`;
- `schemaVersion: 2`;
- `primarySourceId`;
- `primaryMangaId`;
- `linkedSources`.

Backup v1/v2 tetap didukung oleh import layer untuk compatibility yang sudah diimplementasikan.

## Rule utama

- Jangan menganggap satu title = satu source.
- Jangan mengarang chapter progress saat relink.
- Jangan menghapus unresolved history.
- Jangan memakai canonical search key sebagai pengganti SavedTitleId milik user.
