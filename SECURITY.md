# Security Policy

## Pelaporan Kerentanan / Reporting Vulnerabilities

Jika kamu menemukan kerentanan keamanan, **jangan** buat public issue.

Kirim email ke maintainer atau buat [private security advisory](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability) di GitHub.

> If you discover a security vulnerability, **do not** open a public issue. Use GitHub's private security advisory feature or contact the maintainer directly.

## Cakupan

Yang termasuk dalam scope:

- Image proxy bypass (HMAC signature validation)
- Firebase Security Rules misconfiguration
- API route injection atau parameter tampering
- Environment variable exposure di client bundle
- XSS melalui konten manga yang tidak di-sanitize

Yang **tidak** termasuk:

- Kerentanan di sumber manga pihak ketiga
- Isu di dependensi upstream yang sudah punya CVE terbuka
- Rate limiting di environment development

## Arsitektur Keamanan

- **Image proxy** menggunakan HMAC-SHA256 signature. URL tanpa signature valid akan ditolak.
- **Security headers** (`X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`) diset di `next.config.ts`.
- **Environment variables** divalidasi saat startup via Zod schema di `src/env.ts`. Aplikasi gagal start jika ada variabel yang hilang atau tidak valid.
- **Firebase Auth** menangani autentikasi. Firestore Security Rules menangani otorisasi data.
- **Supabase RLS** (Row Level Security) melindungi akses database langsung.

## Response Time

Kami akan merespons laporan keamanan dalam 72 jam.
