# Security Policy

## Supported Versions

Currently, only the `main` branch (latest version) is supported with security updates.

## Reporting a Vulnerability

Please do not report security vulnerabilities through public GitHub issues.

Instead, please email the maintainers directly or use GitHub's private vulnerability reporting feature if enabled. We will acknowledge receipt of your vulnerability report within 48 hours and strive to send you regular updates about our progress.

## Security Model Notes

- **Firebase Access**: Yomirra uses Firebase heavily on the client side. Firestore Security Rules enforce access control. Only authenticated users can access their own `library`, `history`, and `preferences`.
- **Image Proxying**: Yomirra proxies images from external sources to bypass referer restrictions and CORS. The proxy endpoints use HMAC signatures to prevent abuse and hotlinking. See `src/server/lib/validation/hmac.ts` for details.
- **No Direct Environment Access**: Client components must NEVER access `process.env` directly. All environment variables must pass through `src/env.ts`.
