"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, DownloadSimple, GearSix, HardDrives } from "@phosphor-icons/react";
import { MAIN_NAV_ITEMS, type NavItem } from "@/shared/config/nav";
import { cn } from "@/shared/utils/cn";

const MORE_ITEMS: NavItem[] = [
  { href: "/sources", label: "Sumber", icon: HardDrives },
  { href: "/updates", label: "Pembaruan", icon: Bell },
  { href: "/downloads", label: "Unduhan", icon: DownloadSimple },
  { href: "/settings", label: "Pengaturan", icon: GearSix },
];

export function DesktopRail() {
  const pathname = usePathname();

  const renderItem = (item: NavItem) => {
    const active = item.href === "/" ? pathname === "/" : pathname?.startsWith(item.href);
    const Icon = item.icon;

    return (
      <Link
        key={item.href}
        href={item.href}
        aria-label={item.label}
        aria-current={active ? "page" : undefined}
        title={item.label}
        className={cn(
          "group flex min-h-11 items-center justify-center xl:justify-start gap-3 rounded-xl px-3 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent",
          active
            ? "bg-accent/12 text-accent font-bold"
            : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
        )}
      >
        <Icon size={21} weight={active ? "fill" : "regular"} className="shrink-0" />
        <span className="hidden xl:block truncate text-sm">{item.label}</span>
      </Link>
    );
  };

  return (
    <aside className="hidden md:flex fixed inset-y-0 left-0 top-[72px] z-30 w-[76px] xl:w-[220px] flex-col border-r border-border-subtle bg-surface-base/95 px-2 xl:px-3 py-6 backdrop-blur-xl">
      <nav aria-label="Navigasi utama" className="flex flex-col gap-1">
        <span className="hidden xl:block px-3 pb-2 text-[11px] font-bold uppercase tracking-widest text-text-muted">Jelajah</span>
        {MAIN_NAV_ITEMS.map(renderItem)}
      </nav>
      <nav aria-label="Navigasi lainnya" className="mt-7 flex flex-col gap-1 border-t border-border-subtle pt-5">
        <span className="hidden xl:block px-3 pb-2 text-[11px] font-bold uppercase tracking-widest text-text-muted">Lainnya</span>
        {MORE_ITEMS.map(renderItem)}
      </nav>
    </aside>
  );
}
