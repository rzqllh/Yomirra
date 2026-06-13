# Yomirra Zero-Base Rework Acceptance Checklist

Use this before marking any phase complete.

## 1. Evidence

- [ ] Repo files were scanned.
- [ ] Evidence map produced.
- [ ] Files touched are listed.
- [ ] Logic touched is listed or explicitly “none”.
- [ ] No screenshot-only conclusions.

## 2. Visual language

- [ ] UI no longer resembles Android Material 2018.
- [ ] UI no longer resembles generic shadcn demo.
- [ ] Light mode does not look like pale teal dashboard.
- [ ] Dark mode has strong Deep Lagoon identity.
- [ ] Headers are contextual, not rigid repeated boxes.
- [ ] Search field is branded, not generic form input.
- [ ] Bottom dock/sidebar feels premium and intentional.
- [ ] Segmented controls are readable and polished.
- [ ] Manga cards feel like media objects.
- [ ] Pages do not all use the same template.

## 3. Page identity

- [ ] Home feels like discovery/feed.
- [ ] Library feels like catalog/search shelf.
- [ ] Bookmark feels like personal shelf/history.
- [ ] Sources feels like source management.
- [ ] Settings feels like grouped preferences.
- [ ] Manga detail feels cinematic.
- [ ] Reader feels content-first.

## 4. Technical quality

- [ ] No new raw hex colors in components.
- [ ] No new arbitrary magic values unless documented.
- [ ] Tokens used for surface/elevation/focus/media.
- [ ] No horizontal overflow.
- [ ] Mobile 375px and 390px checked.
- [ ] Desktop layout is not stretched mobile.
- [ ] Safe area respected.
- [ ] Keyboard/focus states preserved.
- [ ] ARIA labels present for icon-only buttons.
- [ ] Reduced motion considered.

## 5. Logic safety

- [ ] Source adapters unchanged unless justified.
- [ ] Readlist/bookmark/history behavior preserved.
- [ ] Reader navigation preserved.
- [ ] Auth/local/cloud sync preserved.
- [ ] Back behavior remains context-aware.
- [ ] No mock data replacing real data.

## 6. Image/cache/PWA

- [ ] Image optimization does not break external images.
- [ ] `priority` only used for true above-the-fold images.
- [ ] `sizes` calibrated.
- [ ] SW/PWA setup is explicit before implementation.
- [ ] Metadata cache and image cache are separated.
- [ ] Image proxy is secure if implemented.
- [ ] Cache expiration/LRU policy exists.

## 7. Verification

Run and report:

```bash
pnpm lint
pnpm typecheck
pnpm build
```

Also run available tests if present.

Manual smoke routes:

- [ ] Home
- [ ] Library
- [ ] Bookmark
- [ ] Sources
- [ ] Settings
- [ ] Manga Detail
- [ ] Reader

## Final report format

```md
# Phase Report

## Summary
...

## Files changed
...

## New primitives/components
...

## Pages migrated
...

## Logic touched
...

## Verification
- lint:
- typecheck:
- build:
- tests:

## Known issues
...

## Next recommendation
...
```
