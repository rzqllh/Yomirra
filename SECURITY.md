# Security Policy

Security fix diterapkan ke kode terbaru di `main`. Commit lama, fork, dan unofficial deployment tidak dijamin mendapat perbaikan.

## Melaporkan vulnerability

Jangan membuka public issue untuk vulnerability.

Gunakan GitHub private vulnerability reporting jika tersedia. Jika tidak, hubungi maintainer melalui contact method yang tertera di profil GitHub.

Sertakan:

- komponen/route/source yang terdampak;
- langkah reproduksi;
- impact;
- expected vs actual behavior;
- proof of concept minimal bila aman.

Jangan kirim credential production, data user nyata, atau payload destruktif.

## Boundary utama

### Environment variables

- Jangan commit `.env` atau `.env.local`.
- Server-only secret tidak boleh memakai prefix `NEXT_PUBLIC_`.
- Firebase `NEXT_PUBLIC_*` adalah konfigurasi browser, bukan authorization layer.
- `IMAGE_PROXY_SECRET` diperlukan untuk signed image proxy. Jika tidak tersedia, Yomirra dapat memakai direct image URL; jangan menggantinya dengan secret default yang lemah.
- `GEMINI_API_KEY`, Telegram token, cron secret, dan Redis URL tetap server-side.

### Firebase

Authentication bukan authorization. Firestore rules harus membatasi data per user. Client tidak boleh dianggap trusted hanya karena sudah login.

### Redis dan search catalog

Redis dipakai untuk server cache dan catalog search. `REDIS_URL` tidak boleh dikirim ke browser.

Catalog semantic hanya boleh menerima metadata manga publik dari jalur source yang dipercaya. Jangan memasukkan library, reading history, progress, account data, atau payload bebas dari client ke catalog bersama.

### Image proxy

Perubahan pada image proxy harus mempertahankan validasi URL, signature saat proxy signing aktif, host safety, timeout/size limits, dan perlindungan terhadap open proxy/SSRF.

### Source adapters

Response source adalah untrusted input.

- normalisasi data di boundary;
- pakai timeout;
- sanitasi error yang dikirim ke client;
- jangan log token, cookie, authorization header, atau signed URL;
- jangan bypass access control upstream;
- hormati rate limit dan aturan source.

### Dynamic source manifests

Manifest dynamic hanya untuk publisher/API yang dipercaya. Model ini tidak menjalankan arbitrary transformation code dan bukan sandbox untuk source yang tidak dikenal.

### PWA dan offline data

Chapter yang didownload dapat tetap berada di browser storage setelah logout. Jangan simpan secret di Cache Storage. Pada perangkat bersama, user perlu menghapus download/site data bila diperlukan.

## Disclosure

Beri maintainer waktu yang wajar untuk investigasi dan perbaikan sebelum disclosure publik. Project tidak menjanjikan bug bounty atau SLA response.
