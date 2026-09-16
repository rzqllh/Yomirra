import { Home01Icon, BookOpen01Icon, Bookmark02Icon, Search01Icon, Settings02Icon } from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";

export interface NavItem {
  href: string;
  label: string;
  icon: IconSvgElement;
}

export const MAIN_NAV_ITEMS: NavItem[] = [
  { href: "/", icon: Home01Icon, label: "Beranda" },
  { href: "/library", icon: BookOpen01Icon, label: "Jelajah" },
  { href: "/bookmark", icon: Bookmark02Icon, label: "Rak Buku" },
  { href: "/search", icon: Search01Icon, label: "Cari" },
];

export const DOCK_NAV_ITEMS: NavItem[] = [
  { href: "/", icon: Home01Icon, label: "Beranda" },
  { href: "/library", icon: BookOpen01Icon, label: "Jelajah" },
  { href: "/bookmark", icon: Bookmark02Icon, label: "Rak Buku" },
  { href: "/search", icon: Search01Icon, label: "Cari" },
  { href: "/settings", icon: Settings02Icon, label: "Pengaturan" },
];
