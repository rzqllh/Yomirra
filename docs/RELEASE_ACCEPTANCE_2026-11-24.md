# Follow-up release acceptance (2026-11-24)

Baseline main b4d63089019dfc7312ef7aa9a07845c23fd3ec69; PR #174 had all five CI checks pass and Production READY. This follow-up has no claimed CI result before the exact head is verified.

## Changes
- Common conservative tracker-ID projection across catalog, discovery and popularity. No automatic persistent identity or history migration; ambiguity, source edition collision and conflicting ID vetoes.
- Stable reviewed work route for unsaved works and additive bookmark action. Reviewed registry remains version-controlled and empty until independently verified provider bindings are supplied. No fabricated works, no mutation of existing saved progress.
- Health digest rejects stale/future and misidentified snapshots; canonical saved and card navigation distinguish monitoring failure from explicit disable.
- Strict cache requests reject legacy responses without expiry; changed catalog text invalidates old vector embeddings.
- robots/sitemap routes for navigation surfaces, not a claim that search crawlers indexed the application.
- Offline benchmark evaluator measures pair precision/recall and coverage from independently labeled inputs. Synthetic fixtures exercise the method, not the requested 300-work live benchmark.

## Remaining acceptance
- Provider code and content authorization are separate. No activation of restricted, duplicate, paywalled or unknown candidates; owner approval does not confer third-party rights. The four SFW beta candidates remain gated until permitted upstream use can be established.
- Live Firebase acceptance requires a real signed-in session. No fabricated UID or token; no private data retrieved.
- MangaBaka license requires attribution, noncommercial use or commercial license, and separate third-party rights. Reference https://mangabaka.org/about/data-license. MangaUpdates API contract/usage reference https://mangaupdates.apidocumentation.com/. No bulk API harvesting; do not infer adult safety from a missing content rating.
- Persistent global identity population, actual 300-work benchmark, full chapter mapping, full app/editorial visual acceptance, live ops and user multi-device testing remain outstanding.
- Runtime log scan: last 30 minutes returned no grouped error/fatal rows. This is not a full historical health assessment; Hobby retention limited to one hour. Observability query for request count rejected by endpoint; no invented usage or cache-hit figures.
- No paid plan changes, force merge, manual deploy, user-data migration or deletion.
