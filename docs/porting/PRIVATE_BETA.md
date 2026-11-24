# Private beta (metadata-only)

The public source registry, normal source APIs, reader and public discovery remain unchanged. A signed-in account may access the isolated Sources beta panel only when the backend verifies a non-revoked Firebase ID token and resolves the configured owner email to the same current UID. No admin key, cookie or client-side email provides beta access.

Server environment:
- YOMIRRA_PRIVATE_BETA_EMAIL: owner's verified email. Never expose in NEXT_PUBLIC variables or commit the actual address.
- FIREBASE_SERVICE_ACCOUNT_KEY: existing Firebase Admin configuration, required. Fail closed if absent.
- YOMIRRA_PRIVATE_BETA_SOURCE_IDS: comma-separated supported source IDs for which upstream access has been approved. Defaults to empty; no live calls until configured. No wildcard.

Only four implemented SFW candidates are eligible for this metadata test. Restricted, duplicate and access-limited prototypes remain excluded. The panel does not resolve pages, download images, mutate reading state or insert beta records in the public catalog. Live parity and upstream permission must be established before extending to full reader/discovery access. The token is sent in Authorization and every response is private/no-store; the service worker uses NetworkOnly for the beta path.

Acceptance: verify owner/other account/guest, revoked token, logout and account switch; verify source allowlist, safe classification, and zero public registry/cache changes. Mock tests do not constitute live Firebase acceptance.
