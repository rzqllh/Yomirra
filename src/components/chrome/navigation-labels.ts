export const navigationLabels = {
  home: "Beranda",
  library: "Jelajah",
  bookmark: "Library",
  search: "Cari",
  popular: "Populer",
  sources: "Sumber",
  updates: "Jadwal Mingguan",
  downloads: "Unduhan",
  settings: "Pengaturan",
  account: "Akun & Sinkronisasi",
  help: "Pusat Bantuan",
  manga: "Komik",
  catalog: "Katalog",
} as const;

export function getNavigationTrail(pathname: string) {
  const [root, child] = pathname.split("/").filter(Boolean);
  if (!root) return { label: navigationLabels.home };

  const label = Object.hasOwn(navigationLabels, root)
    ? navigationLabels[root as keyof typeof navigationLabels]
    : root;

  if (root === "sources" && child) {
    return { label: "Katalog sumber", parent: { href: "/sources", label } };
  }
  if (root === "updates") {
    return { label, parent: { href: "/bookmark", label: navigationLabels.bookmark } };
  }
  if (root === "account") {
    return { label, parent: { href: "/settings", label: navigationLabels.settings } };
  }
  if (root === "catalog" && child === "saved") {
    return { label: "Komik tersimpan", parent: { href: "/bookmark", label: navigationLabels.bookmark } };
  }
  if (root === "manga" && child) {
    return { label, parent: { href: "/library", label: navigationLabels.library } };
  }

  return { label };
}

export function allowsTopNavSearch(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  return segments[0] !== "search" && !(segments[0] === "manga" && segments[3] === "read");
}
