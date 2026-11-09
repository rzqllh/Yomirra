# YOMIRRA — UI/UX REMEDIATION EXECUTION PACK v2
**Tanggal audit:** 9 November 2026  
**Tujuan:** melakukan *perbaikan sistemik* atas UX dan UI yang tidak semestinya, **bukan redesign identitas Yomirra**.  
**Status saat dikirim:** INSPECTED_SCREENSHOTS / PLANNING_ONLY; **NOT IMPLEMENTED; NOT TESTED; NO OWNER APPROVAL FOR CHANGES**.

## Quick facts
- **51 screenshot utama** (`IMG_3753` sampai `IMG_3803`) telah diklasifikasi per page/state. Duplikat unggahan `(1)` dari nomor yang sama tidak dihitung sebagai bukti baru.
- **88 tiket audit**: 68 observasi visual/perilaku yang dikonfirmasi, 19 hipotesis QA, 1 usulan murni. Angka tiket adalah *unit pelacakan*, bukan jumlah bug terverifikasi di kode.
- **83 nama area komponen konseptual** dalam issue register (bukan path/identifier source repo yang sudah diverifikasi).
- **35 focus-region crops** + **5 contact sheets**. Screenshot asli disertakan untuk membantu agent ber-konteks pendek.
- Belum ada akses repo / runtime, tidak ada browser/device QA, tidak ada perubahan data, security, kode, instalasi, atau deployment.

## Urutan membaca untuk agent dengan konteks pendek
1. `00_START_HERE/KNOWN_FACTS_AND_GUARDRAILS.md` — bedakan apa yang disetujui/fakta dari hipotesis.
2. `01_AUDIT/ROOT_CAUSE_AND_PRIORITIES.md` — akar masalah dan efek lintas halaman.
3. `05_PLAN/EXECUTION_ROADMAP.md` — urutan kerja, dependency, gate, deliverable dan rollback.
4. `03_ISSUE_TRACKER/issues.csv` / `issues.json` — tugas atomic; pilih 1 workstream setiap kali.
5. `02_PAGE_MAPS/INDEX.md` — locator page → komponen → elemen, lalu buka screenshot di `09_VISUAL_EVIDENCE`.
6. `07_OWNER_GRILLME/OWNER_DECISIONS.md` — pertanyaan yang **tidak boleh dijawab dengan tebakan agent**.
7. `06_QA/TEST_MATRIX.csv` — checklist regresi dan test yang masih NOT_RUN.
8. `08_AGENT_HANDOFF/AGENT_START_PROMPT.md` — instruksi kerja ke agent berikutnya.

## Isi package
- `01_AUDIT/` — cakupan, kesimpulan, masalah bersama, hal yang *tidak* terbukti.
- `02_PAGE_MAPS/` — per halaman dan per komponen/elemen dengan nama serta screenshot spesifik.
- `03_ISSUE_TRACKER/` — 88 tiket lengkap (`.md`, `.csv`, `.json`), status dan keputusan default.
- `04_CONTRACTS/` — **proposal** kontrak layout, overlay, reader, component states, copy; bukan desain baru yang disetujui.
- `05_PLAN/` — roadmap, workstreams, dependency, phase gates, dan task batching.
- `06_QA/` — test matrix, definisi bukti, checklist accessibility/regression.
- `07_OWNER_GRILLME/` — pertanyaan dalam round maksimal 5; tidak untuk membuat agent stuck pada fix independen.
- `08_AGENT_HANDOFF/` — briefing siap pakai dan template inspeksi/perubahan.
- `09_VISUAL_EVIDENCE/` — screenshot asli, contact sheets dan crop fokus.
- `10_REFERENCES/` — audit v1 asli untuk traceability; tracker v2 adalah yang dipakai.

## Kontrak hasil yang dituju
**Perbaikan nyata** berarti masalah tidak muncul lagi di seluruh halaman yang menggunakan komponen yang sama, tidak ada regresi interaksi/data, dan ada bukti *before/after plus test*. Menggeser margin satu screenshot sehingga terlihat bagus namun merusak yang lain bukan selesai.

## Track progress
Default semua tiket: `BACKLOG_UNVALIDATED`, `NOT_APPROVED`, `UNRUN`. Catatan fix dan status harus diperbarui *di repo/task tracker user* oleh agent **setelah** owner memberi izin. Jangan tulis PASS tanpa tes.

## Privasi
Screenshot merupakan materi pemilik; beberapa berisi nama akun, avatar dan alamat email. Jangan mengunggah ZIP/screenshot ke layanan eksternal atau repo publik tanpa izin pemilik. Bukti lokal cukup untuk inspeksi.
