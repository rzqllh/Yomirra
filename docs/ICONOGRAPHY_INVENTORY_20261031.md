# Iconography implementation inventory — 31 October 2026

Phosphor remains the UI family. Default/action weight is regular; existing fill states are retained. Duotone is retained for larger illustrative states. No icon dependency was added or removed. Rules and old→new meaning mapping are in SETTINGS_ICON_AUDIT_20261031.md.

**Coverage:** 113 components / 478 direct Phosphor JSX consumers under src, excluding tests. Default means omitted weight (Phosphor regular). Dynamic includes conditional selected-state weights. This is a syntax inventory, not visual/semantic acceptance of every screen, optical alignment, VoiceOver or real-device QA.

| Component | Icons | Uses | Regular/default | Fill | Duotone | Dynamic |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| src/app/(web)/account/page.tsx | ArrowsClockwise, Bookmarks, CheckCircle, Clock, CloudCheck, DeviceMobile, GoogleLogo, ShieldCheck, SignOut, UserCircle, WarningCircle, WifiHigh, WifiSlash | 16 | 12 | 2 | 2 | 0 |
| src/app/(web)/downloads/loading.tsx | Download | 1 | 1 | 0 | 0 | 0 |
| src/app/(web)/downloads/page.tsx | ArrowClockwise, BookOpen, Database, Download, Pause, Play, Trash, X | 11 | 7 | 1 | 3 | 0 |
| src/app/(web)/error.tsx | ArrowCounterClockwise, House, Question | 3 | 2 | 1 | 0 | 0 |
| src/app/(web)/manga/[sourceId]/[mangaId]/read/[chapterId]/error.tsx | WarningCircle | 1 | 0 | 0 | 1 | 0 |
| src/app/(web)/manga/[sourceId]/[mangaId]/read/[chapterId]/page.tsx | WarningCircle | 1 | 0 | 0 | 1 | 0 |
| src/app/(web)/not-found.tsx | Compass, House | 2 | 0 | 2 | 0 | 0 |
| src/app/(web)/page.tsx | WarningCircle | 1 | 0 | 0 | 1 | 0 |
| src/app/(web)/popular/page.tsx | Fire | 1 | 1 | 0 | 0 | 0 |
| src/app/(web)/settings/components/settings-ui.tsx | CaretRight | 1 | 1 | 0 | 0 | 0 |
| src/app/(web)/settings/loading.tsx | Gear | 1 | 1 | 0 | 0 | 0 |
| src/app/(web)/sources/[sourceId]/page.tsx | Compass, House, WarningCircle | 3 | 1 | 0 | 2 | 0 |
| src/app/(web)/sources/loading.tsx | HardDrives | 1 | 1 | 0 | 0 | 0 |
| src/app/(web)/sources/page.tsx | HardDrives, ShieldWarning | 4 | 1 | 0 | 2 | 1 |
| src/app/(web)/updates/loading.tsx | CalendarBlank | 1 | 1 | 0 | 0 | 0 |
| src/app/(web)/updates/page.tsx | CalendarBlank | 1 | 1 | 0 | 0 | 0 |
| src/components/account/guest-merge-dialog.tsx | ArrowClockwise, ArrowsClockwise, Bookmarks, CloudCheck, GitMerge, ShieldCheck, Warning, WarningCircle | 8 | 8 | 0 | 0 | 0 |
| src/components/admin/admin-layout.tsx | ArrowSquareOut, ArrowsClockwise, CircleNotch, Command, Eye, EyeSlash, List, LockKey, ShieldCheck, SignOut, X | 14 | 13 | 1 | 0 | 0 |
| src/components/admin/components/admin-ui.tsx | CaretDown, CheckCircle, WarningCircle, X | 4 | 2 | 2 | 0 | 0 |
| src/components/admin/sources/core-source-modal.tsx | CircleNotch, FloppyDisk, Globe, SlidersHorizontal, X | 5 | 5 | 0 | 0 | 0 |
| src/components/admin/sources/custom-source-modal.tsx | CheckCircle, CircleNotch, Code, FloppyDisk, Globe, Lightning, Question, SlidersHorizontal, WarningCircle, X | 12 | 10 | 2 | 0 | 0 |
| src/components/admin/tabs/overview-tab.tsx | ArrowRight, ArrowsClockwise, CircleNotch, Flag, HardDrives, Heartbeat, Megaphone, PaperPlaneTilt, Trash, WarningCircle | 17 | 14 | 3 | 0 | 0 |
| src/components/admin/tabs/reports-tab.tsx | ArrowSquareOut, BookOpen, Check, CircleNotch, Flag, Hash, ImageIcon, Lightning, MagnifyingGlass, Question, SealCheck, Trash, Wrench | 17 | 16 | 1 | 0 | 0 |
| src/components/admin/tabs/search-tab.tsx | CircleNotch, Database, Flame, MagnifyingGlass, SlidersHorizontal, WarningCircle | 7 | 7 | 0 | 0 | 0 |
| src/components/admin/tabs/site-tab.tsx | CircleNotch, Eye, FloppyDisk, Megaphone, SlidersHorizontal, Wrench | 11 | 11 | 0 | 0 | 0 |
| src/components/admin/tabs/sources-tab.tsx | ArrowSquareOut, CircleNotch, Globe, Heartbeat, Lightning, PencilSimple, Plus, SlidersHorizontal, Trash | 25 | 25 | 0 | 0 | 0 |
| src/components/admin/tabs/telemetry-tab.tsx | ArrowsClockwise, CircleNotch, Eye, HardDrives, MagnifyingGlass, PaperPlaneTilt, Trash, X | 15 | 15 | 0 | 0 | 0 |
| src/components/auth/guest-action-gate-modal.tsx | DeviceMobile, FolderPlus, GoogleLogo, Star | 4 | 3 | 1 | 0 | 0 |
| src/components/bookmark/bookmark-page-view.tsx | Books, CalendarBlank | 2 | 2 | 0 | 0 | 0 |
| src/components/bookmark/collection-selection-toolbar.tsx | Trash | 1 | 1 | 0 | 0 | 0 |
| src/components/bookmark/collection-tab.tsx | BookBookmark, Compass, Folder, MagnifyingGlass, PencilSimple, Trash | 6 | 4 | 0 | 2 | 0 |
| src/components/bookmark/collection-toolbar.tsx | CheckCircle, DotsThreeVertical, Plus | 3 | 2 | 0 | 0 | 1 |
| src/components/bookmark/reading-tab.tsx | Clock, Compass | 2 | 1 | 0 | 1 | 0 |
| src/components/chrome/desktop-rail.tsx | BookOpen, SidebarSimple | 2 | 0 | 1 | 0 | 1 |
| src/components/chrome/header-actions.tsx | CaretRight, Gear, Globe, Palette, Question, SignIn, SignOut, Stack | 12 | 10 | 1 | 0 | 1 |
| src/components/chrome/header.tsx | CaretLeft | 1 | 1 | 0 | 0 | 0 |
| src/components/chrome/top-nav.tsx | Globe, MagnifyingGlass, Question, SignOut, UserCircle | 7 | 7 | 0 | 0 | 0 |
| src/components/collection/collection-modals.tsx | FolderPlus, PencilSimple | 2 | 2 | 0 | 0 | 0 |
| src/components/download/storage-warning-banner.tsx | Warning, X | 2 | 1 | 1 | 0 | 0 |
| src/components/home/continue-reading-list.tsx | ArrowRight | 1 | 1 | 0 | 0 | 0 |
| src/components/home/editorial-spotlight.tsx | ArrowRight, CaretLeft, CaretRight, Star | 5 | 3 | 2 | 0 | 0 |
| src/components/home/home-feed-client.tsx | ArrowRight, BookmarkSimple, MagnifyingGlass | 3 | 2 | 1 | 0 | 0 |
| src/components/home/home-hero.tsx | MagnifyingGlass | 2 | 2 | 0 | 0 | 0 |
| src/components/home/home-leaderboard-panel.tsx | ArrowRight | 1 | 1 | 0 | 0 | 0 |
| src/components/home/home-view.tsx | House | 1 | 1 | 0 | 0 | 0 |
| src/components/komik/alternate-source-modal.tsx | ArrowRight, ArrowsClockwise, CheckCircle, MagnifyingGlass, Warning | 8 | 4 | 4 | 0 | 0 |
| src/components/komik/bookmark-button.tsx | BookmarkSimple | 1 | 0 | 0 | 0 | 1 |
| src/components/komik/canonical-source-dialog.tsx | ArrowRight, Compass | 2 | 2 | 0 | 0 | 0 |
| src/components/komik/card/leaderboard-row.tsx | Star | 1 | 0 | 1 | 0 | 0 |
| src/components/komik/card/manga-card.tsx | BookOpen, DotsThreeVertical, Eye, Play, Star, Trash, TrendUp | 10 | 5 | 5 | 0 | 0 |
| src/components/komik/chapter-download-button.tsx | CheckCircle, CircleNotch, DownloadSimple, Pause, XCircle | 6 | 3 | 3 | 0 | 0 |
| src/components/komik/chapter-row.tsx | CaretLeft, Lock | 3 | 3 | 0 | 0 | 0 |
| src/components/komik/dead-source-recovery.tsx | ArrowClockwise, ArrowLeft, BookOpen, MagnifyingGlass, Warning | 5 | 4 | 1 | 0 | 0 |
| src/components/komik/manga-actions.tsx | BookmarkSimple | 1 | 0 | 0 | 0 | 1 |
| src/components/komik/manga-collection-button.tsx | FolderPlus | 4 | 3 | 0 | 0 | 1 |
| src/components/komik/manga-cover.tsx | ImageBroken | 1 | 0 | 0 | 1 | 0 |
| src/components/komik/manga-detail-error-state.tsx | ArrowClockwise, ArrowLeft, HardDrives, MagnifyingGlass, WarningCircle | 7 | 7 | 0 | 0 | 0 |
| src/components/komik/manga-detail-view.tsx | Book, Play, SortAscending, SortDescending, Star | 8 | 2 | 3 | 3 | 0 |
| src/components/komik/manga-header-actions.tsx | Bell, BellSlash, ShareNetwork | 3 | 1 | 1 | 0 | 1 |
| src/components/komik/manga-rating.tsx | Star | 2 | 0 | 0 | 0 | 2 |
| src/components/komik/manga-source-selector.tsx | ArrowRight, Compass, Star | 6 | 3 | 1 | 0 | 2 |
| src/components/komik/manga-status-button.tsx | BookOpenText | 2 | 1 | 0 | 0 | 1 |
| src/components/komik/view-mode-toggle.tsx | Rows, SquaresFour | 2 | 0 | 0 | 0 | 2 |
| src/components/layout/maintenance-view.tsx | ShieldWarning, Wrench | 2 | 2 | 0 | 0 | 0 |
| src/components/layout/site-announcement-banner.tsx | ArrowSquareOut, Info, Warning, WarningOctagon, X | 5 | 2 | 3 | 0 | 0 |
| src/components/library/guest-sync-banner.tsx | CloudArrowUp, GoogleLogo, HardDrives, X | 4 | 4 | 0 | 0 | 0 |
| src/components/library/library-page-view.tsx | Compass | 1 | 1 | 0 | 0 | 0 |
| src/components/library/library-results.tsx | Books, Check, HardDrives, MagnifyingGlass, SmileySad | 6 | 1 | 0 | 5 | 0 |
| src/components/library/library-toolbar.tsx | CheckCircle, DotsThreeVertical, Funnel | 3 | 1 | 0 | 0 | 2 |
| src/components/overlays/command-menu.tsx | ArrowRight, MagnifyingGlass | 2 | 2 | 0 | 0 | 0 |
| src/components/overlays/network-status.tsx | WifiHigh, WifiSlash | 2 | 2 | 0 | 0 | 0 |
| src/components/overlays/onboarding-overlay.tsx | DownloadSimple, Export, PlusSquare | 4 | 4 | 0 | 0 | 0 |
| src/components/overlays/theme-toggle.tsx | Moon, Sun | 2 | 2 | 0 | 0 | 0 |
| src/components/overlays/updates-bell.tsx | ArrowRight, Bell, BookOpen | 4 | 2 | 0 | 1 | 1 |
| src/components/popular/popular-page-view.tsx | WarningCircle | 1 | 0 | 0 | 1 | 0 |
| src/components/providers/offline-provider.tsx | HardDrives, WifiSlash | 3 | 1 | 1 | 1 | 0 |
| src/components/reader/continuous-vertical-reader.tsx | BookOpen, CaretLeft, CaretRight, Flag, Warning | 7 | 5 | 2 | 0 | 0 |
| src/components/reader/page-image-error.tsx | Flag, WarningCircle | 2 | 1 | 0 | 1 | 0 |
| src/components/reader/paged-reader.tsx | CaretLeft, CaretRight, Warning | 3 | 2 | 1 | 0 | 0 |
| src/components/reader/reader-chapter-drawer.tsx | List, SortAscending, SortDescending | 3 | 3 | 0 | 0 | 0 |
| src/components/reader/reader-panel-shell.tsx | X | 1 | 1 | 0 | 0 | 0 |
| src/components/reader/reader-settings-drawer.tsx | ArrowsOutLineVertical, BoundingBox, ImageSquare, Layout, Lightning, SlidersHorizontal | 9 | 9 | 0 | 0 | 0 |
| src/components/reader/reader-shell.tsx | ArrowLeft, BookmarkSimple, CaretLeft, CaretRight, CaretUp, Gear, List | 7 | 6 | 0 | 0 | 1 |
| src/components/reader/reader-view.tsx | LockKey, WarningCircle | 2 | 0 | 0 | 2 | 0 |
| src/components/search/search-page-view.tsx | MagnifyingGlass | 1 | 1 | 0 | 0 | 0 |
| src/components/search/search-results.tsx | MagnifyingGlass, WarningCircle | 5 | 0 | 1 | 4 | 0 |
| src/components/search/search-source-rail.tsx | CheckCircle | 1 | 0 | 1 | 0 | 0 |
| src/components/search/search-tag-input.tsx | X | 1 | 1 | 0 | 0 | 0 |
| src/components/settings/backup-restore-modal.tsx | DownloadSimple, FileText, ShieldWarning, UploadSimple | 5 | 4 | 1 | 0 | 0 |
| src/components/settings/collection-manager.tsx | Folder, PencilSimple, Plus, Trash | 4 | 4 | 0 | 0 | 0 |
| src/components/settings/settings-view.tsx | ArrowsClockwise, Bell, Broom, CaretLeft, Clock, Compass, DeviceMobile, FileText, Fire, Gear, Globe, Palette, ShieldWarning, Trash, UserCircle, WifiHigh | 21 | 20 | 0 | 1 | 0 |
| src/components/shared/report-sheet.tsx | Flag, PaperPlaneRight, Spinner | 3 | 2 | 1 | 0 | 0 |
| src/components/shared/unified-filter-drawer.tsx | Funnel | 1 | 1 | 0 | 0 | 0 |
| src/components/skeletons/popular-skeleton.tsx | Fire | 1 | 1 | 0 | 0 | 0 |
| src/components/source/source-card.tsx | ArrowsClockwise, Bug, DotsThreeVertical, Plug, Trash | 5 | 5 | 0 | 0 | 0 |
| src/components/states/error-state.tsx | WarningCircle | 3 | 1 | 0 | 2 | 0 |
| src/components/ui/applied-filters.tsx | X | 1 | 1 | 0 | 0 | 0 |
| src/components/ui/button.tsx | CircleNotch | 1 | 1 | 0 | 0 | 0 |
| src/components/ui/choice.tsx | Check, Circle | 2 | 1 | 1 | 0 | 0 |
| src/components/ui/command.tsx | MagnifyingGlass, X | 2 | 2 | 0 | 0 | 0 |
| src/components/ui/confirmation-modal.tsx | Info, Trash, Warning | 3 | 3 | 0 | 0 | 0 |
| src/components/ui/custom-select.tsx | CaretDown, Check | 2 | 2 | 0 | 0 | 0 |
| src/components/ui/dialog.tsx | X | 1 | 1 | 0 | 0 | 0 |
| src/components/ui/dropdown-menu.tsx | CaretRight, Check, Circle | 3 | 2 | 1 | 0 | 0 |
| src/components/ui/error-boundary.tsx | Warning | 1 | 0 | 0 | 1 | 0 |
| src/components/ui/filter-chip.tsx | Check | 1 | 1 | 0 | 0 | 0 |
| src/components/ui/filter-drawer-shell.tsx | Funnel | 2 | 1 | 0 | 0 | 1 |
| src/components/ui/pagination.tsx | CaretDoubleLeft, CaretDoubleRight, CaretLeft, CaretRight, DotsThree | 5 | 5 | 0 | 0 | 0 |
| src/components/ui/pull-to-refresh.tsx | ArrowDown, ArrowsClockwise | 2 | 2 | 0 | 0 | 0 |
| src/components/ui/search-input.tsx | MagnifyingGlass, X | 2 | 2 | 0 | 0 | 0 |
| src/components/ui/sheet.tsx | X | 1 | 1 | 0 | 0 | 0 |
| src/components/ui/sonner.tsx | Check, CircleNotch, Info, Warning, X | 5 | 5 | 0 | 0 | 0 |
| src/components/updates/updates-list.tsx | ArrowsClockwise, Bell, BookOpen, CalendarBlank, Play, WarningCircle | 7 | 3 | 2 | 2 | 0 |

Morphicons/custom paths and brand/provider assets remain exceptions. The single MorphIcon feature consumer is MangaDetailView via the reduced-motion-aware shared wrapper. Interactive target size is distinct from glyph size.
