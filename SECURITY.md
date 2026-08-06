# Security Policy

## Supported Version

Security fixes are applied to the latest code on `main`. Older commits, forks, preview deployments, and unofficial builds are not guaranteed to receive updates.

## Reporting a Vulnerability

Do not open a public GitHub issue for a vulnerability.

Use GitHub private vulnerability reporting when it is enabled for the repository. Otherwise, contact the maintainer privately through a verified contact method listed on the maintainer's GitHub profile.

Include:

- A clear description of the issue.
- Affected route, component, or source adapter.
- Reproduction steps.
- Expected and actual behavior.
- Impact assessment.
- A minimal proof of concept, when safe.
- Suggested remediation, when available.

Do not include real user data, production credentials, or destructive payloads.

## Security Boundaries

### Environment Variables

- Never commit `.env` or `.env.local`.
- `IMAGE_PROXY_SECRET` must be long, random, and private.
- Browser-exposed Firebase variables are configuration values, not authorization controls.
- Server-only values must not use the `NEXT_PUBLIC_` prefix.

### Firebase

Authentication alone is not authorization. Firestore access must be enforced through security rules, and users must only be able to read or modify their own synchronized data.

### Redis

Redis is used for server-side caching. Do not expose `REDIS_URL` to the browser. Production Redis instances should require authentication and encrypted transport where supported.

### Image Proxy

The image proxy handles untrusted remote URLs and may attach source-specific referer behavior. Changes must preserve:

- Request validation.
- Signature verification.
- Safe host handling.
- Response size and timeout limits.
- Protection against open-proxy abuse and server-side request forgery.

### Source Adapters

Source responses are untrusted input.

- Validate or normalize remote responses.
- Apply request timeouts.
- Avoid reflecting remote error details or secrets to clients.
- Do not log credentials, signed URLs, cookies, or authorization headers.
- Treat HTML scraping as hostile input.
- Respect source terms and rate limits.

### Dynamic Source Manifests

A dynamic source manifest can direct the server to remote endpoints. Only install manifests from trusted publishers. The current manifest model is intended for normalized JSON APIs, not arbitrary code execution.

### PWA and Offline Data

Downloaded chapters may remain in browser storage after logout unless explicitly removed. Do not use offline storage for secrets. Shared-device users should clear downloads and site data when needed.

## Disclosure

Please allow maintainers reasonable time to investigate and release a fix before public disclosure. The project does not offer a bug bounty or guaranteed response time.
