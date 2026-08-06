import { House, Compass, Books, Gear, BookmarkSimple, MagnifyingGlass, Bell } from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";

export interface NavItem {
  href: string;
  label: string;
  icon: Icon;
}

export const MAIN_NAV_ITEMS: NavItem[] = [
  { href: "/", icon: House, label: "Beranda" },
  { href: "/library", icon: Books, label: "Library" },
  { href: "/updates", icon: Bell, label: "Updates" },
  { href: "/bookmark", icon: BookmarkSimple, label: "Bookmark" },
];

export const DOCK_NAV_ITEMS: NavItem[] = [
  ...MAIN_NAV_ITEMS,
  { href: "/settings", icon: Gear, label: "Pengaturan" },
  { href: "/search", icon: MagnifyingGlass, label: "Cari" },
];
