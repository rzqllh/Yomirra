import { House, Books, Gear, MagnifyingGlass, BookmarkSimple } from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";

export interface NavItem {
  href: string;
  label: string;
  icon: Icon;
}

export const MAIN_NAV_ITEMS: NavItem[] = [
  { href: "/", icon: House, label: "Beranda" },
  { href: "/library", icon: Books, label: "Jelajah" },
  { href: "/bookmark", icon: BookmarkSimple, label: "Rak Buku" },
  { href: "/search", icon: MagnifyingGlass, label: "Cari" },
];

export const DOCK_NAV_ITEMS: NavItem[] = [
  { href: "/", icon: House, label: "Beranda" },
  { href: "/library", icon: Books, label: "Jelajah" },
  { href: "/bookmark", icon: BookmarkSimple, label: "Rak Buku" },
  { href: "/search", icon: MagnifyingGlass, label: "Cari" },
  { href: "/settings", icon: Gear, label: "Pengaturan" },
];
