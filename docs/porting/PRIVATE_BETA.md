# Private beta (isolated reader)

The public source registry, normal source APIs, reader and public discovery remain unchanged. A signed-in account may access the isolated Sources beta panel only when the backend verifies a non-revoked Firebase ID token and resolves the configured owner email to the same current UID. No admin key, cookie or client-side email provides beta access.

Server environment:
- YOMIRRA_PRIVATE_BETA_EMAIL: owner's verified email. Never expose in NEXT_PUBLIC variables or commit the actual address.
- FIREBASE_SERVICE_ACCOUNT_KEY: optional existing Firebase Admin configuration. If absent, the private beta uses Firebase's official accounts:lookup REST endpoint with the existing NEXT_PUBLIC_FIREBASE_API_KEY and NEXT_PUBLIC_FIREBASE_PROJECT_ID. Google must accept the exact ID token; account UID, verified email, issuer/audience, timestamps and validSince are checked. Missing fields or failed validation deny access. This fallback grants no admin privileges.
- YOMIRRA_PRIVATE_BETA_SOURCE_IDS: comma-separated supported source IDs for which upstream access has been approved. Defaults to empty; no live calls until configured. No wildcard.

Only four implemented SFW candidates are eligible for this metadata test. Restricted, duplicate and access-limited prototypes remain excluded. The panel supports detail, explicitly unlocked chapter selection and single-page viewing for approved sources. Every reader request checks owner identity; image tickets expire and are bound to the verified UID and permitted source. Images use the existing outbound IP/size policy, without redirect or access-boundary bypass. No downloads, persistent reading state or public catalog insertion. Live parity and upstream permission must be established before enabling any candidate or extending to normal public-app discovery access. The token is sent in Authorization and every response is private/no-store; the service worker uses NetworkOnly for the beta path.

Acceptance: verify owner/other account/guest, revoked token, logout and account switch; verify source allowlist, safe classification, and zero public registry/cache changes. Mock tests do not constitute live Firebase acceptance.
