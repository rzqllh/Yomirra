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
- `GEMINI_API_KEY`, Telegram token, cron secret, Redis URL, dan `RESTRICTED_SOURCE_APP_SECRET` tetap server-side.
- Jika credential optional untuk satu source tidak tersedia, source tersebut harus gagal tertutup saat request upstream tanpa membuat registry source lain gagal dibangun.

### Admin authentication

Admin authorization diverifikasi di server. Browser admin tidak menyimpan raw passkey di local/session storage; passkey hanya digunakan untuk menukar session bertanda tangan yang HttpOnly, SameSite=Strict, dan berumur pendek.

Mutation yang memakai session cookie wajib memvalidasi same-origin request. Missing admin configuration harus fail-closed.

### Firebase

Authentication bukan authorization. Firestore rules harus membatasi data per user. Client tidak boleh dianggap trusted hanya karena sudah login.

### Redis dan search catalog

Redis dipakai untuk server cache dan catalog search. `REDIS_URL` tidak boleh dikirim ke browser.

Catalog semantic hanya boleh menerima metadata manga publik dari jalur source yang dipercaya. Jangan memasukkan library, reading history, progress, account data, atau payload bebas dari client ke catalog bersama.

### Rate limiting

Rate limit route memakai namespace terpisah per kelas operasi agar satu flow tidak menghabiskan bucket flow lain.

- mutation admin dan admin operation yang mahal bersifat fail-closed jika limiter tidak tersedia;
- optional expensive compute seperti search intelligence bersifat fail-closed;
- public search dan signed image proxy memakai policy availability-first/fail-open bila Redis limiter tidak tersedia;
- user report tetap dibatasi ketat dan fail-closed;
- identity limiter harus berasal dari trusted proxy chain, bukan nilai forwarded client yang dipakai tanpa validasi.

Response limit/rejection harus membawa header limit/reset yang konsisten, dan perubahan policy wajib memiliki regression test.

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

### Logging

Logger application harus meredaksi field credential-bearing sebelum log ditulis, termasuk authorization header, cookie/set-cookie, token, secret, passkey/password, API key, signature, dan sensitive query parameter. Error object boleh dicatat untuk diagnosis hanya setelah melalui sanitizer logger.

### Dynamic source manifests

Manifest dynamic hanya untuk publisher/API yang dipercaya. Model ini tidak menjalankan arbitrary transformation code dan bukan sandbox untuk source yang tidak dikenal.

### PWA dan offline data

Chapter yang didownload dapat tetap berada di browser storage setelah logout. Jangan simpan secret di Cache Storage. Pada perangkat bersama, user perlu menghapus download/site data bila diperlukan.

## Disclosure

Beri maintainer waktu yang wajar untuk investigasi dan perbaikan sebelum disclosure publik. Project tidak menjanjikan bug bounty atau SLA response.
