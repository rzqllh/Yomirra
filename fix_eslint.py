import os

files_to_fix = {
    r"src/app/(web)/library/page.tsx": [
        (69, "      // eslint-disable-next-line react-hooks/set-state-in-effect\n      setQuery(deferredSearchInput.trim());"),
        (97, "        // eslint-disable-next-line react-hooks/set-state-in-effect\n        setSort(filtersData.sorts[0].id);")
    ],
    r"src/components/app/continue-reading-list.tsx": [
        (23, "    // eslint-disable-next-line react-hooks/set-state-in-effect\n    setCards(items);")
    ],
    r"src/components/app/featured-hero-carousel.tsx": [
        (31, "  // eslint-disable-next-line @typescript-eslint/no-explicit-any\n  const handleDragEnd = (event: any, info: any) => {")
    ],
    r"src/components/app/floating-resume-dock.tsx": [
        (17, "    // eslint-disable-next-line react-hooks/set-state-in-effect\n    setIsMounted(true);")
    ],
    r"src/components/app/home-search-pill.tsx": [
        (33, "    // eslint-disable-next-line react-hooks/set-state-in-effect\n    setMounted(true);")
    ],
    r"src/components/app/magazine-hero.tsx": [
        (27, "  // eslint-disable-next-line @typescript-eslint/no-explicit-any\n  const handleDragEnd = (event: any, info: any) => {")
    ],
    r"src/components/app/source-feed.tsx": [
        (52, "  // eslint-disable-next-line react-hooks/purity\n  const shuffledLatest = [...(latest?.mangas || [])].sort(() => 0.5 - Math.random()).slice(0, 10);")
    ],
    r"src/components/manga/chapter-download-button.tsx": [
        (42, "    // eslint-disable-next-line react-hooks/set-state-in-effect\n    setIsPWA(window.matchMedia('(display-mode: standalone)').matches);")
    ]
}

for file_path, replacements in files_to_fix.items():
    full_path = os.path.join(r"c:\Users\Hafizh Rizqullah\Documents\Code\MangaReader-Apps", file_path)
    if os.path.exists(full_path):
        with open(full_path, "r", encoding="utf-8") as f:
            lines = f.readlines()
        
        # Sort replacements by line number descending so we don't mess up the indices
        replacements.sort(key=lambda x: x[0], reverse=True)
        
        for line_num, repl_text in replacements:
            idx = line_num - 1
            # Replace the line with the repl_text
            # Note: repl_text already contains the original line with the comment above it
            lines[idx] = repl_text + "\n"
            
        with open(full_path, "w", encoding="utf-8") as f:
            f.writelines(lines)
