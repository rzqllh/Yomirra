import { House, Books, Compass, MagnifyingGlass, Fire } from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";

export interface NavItem {
  href: string;
  label: string;
  icon: Icon;
}

export const MAIN_NAV_ITEMS: NavItem[] = [
  { href: "/", icon: House, label: "Beranda" },
  { href: "/library", icon: Compass, label: "Jelajah" },
  { href: "/bookmark", icon: Books, label: "Library" },
  { href: "/popular", icon: Fire, label: "Populer" },
  { href: "/search", icon: MagnifyingGlass, label: "Cari" },
];

export const DOCK_NAV_ITEMS: NavItem[] = [
  { href: "/", icon: House, label: "Beranda" },
  { href: "/library", icon: Compass, label: "Jelajah" },
  { href: "/bookmark", icon: Books, label: "Library" },
  { href: "/popular", icon: Fire, label: "Populer" },
  { href: "/search", icon: MagnifyingGlass, label: "Cari" },
];
