"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, DownloadSimple, GearSix, HardDrives } from "@phosphor-icons/react";
import { MAIN_NAV_ITEMS, type NavItem } from "@/shared/config/nav";
import { cn } from "@/shared/utils/cn";

const MORE_ITEMS: NavItem[] = [
  { href: "/sources", label: "Sumber", icon: HardDrives },
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
          "group flex min-h-[36px] items-center justify-center xl:justify-start gap-2.5 rounded-xs px-2.5 py-1.5 transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-accent",
          active
            ? "bg-surface-raised text-text-primary font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.05)] border border-border-subtle/80"
            : "text-text-secondary hover:bg-surface-hover/70 hover:text-text-primary font-medium"
        )}
      >
        <Icon
          size={18}
          weight={active ? "fill" : "regular"}
          className={cn(
            "shrink-0 transition-colors duration-150",
            active ? "text-accent" : "text-text-muted group-hover:text-text-primary"
          )}
        />
        <span className="hidden xl:block truncate text-[13px]">{item.label}</span>
      </Link>
    );
  };

  return (
    <aside className="hidden md:flex fixed top-0 bottom-0 left-0 z-30 w-[76px] xl:w-[240px] flex-col border-r border-border-subtle bg-surface-base px-2.5 xl:px-3.5 py-4 transition-[width] duration-300">
      {/* Brand Header */}
      <div className="flex items-center justify-center xl:justify-start px-2 py-1 mb-5 shrink-0">
        <Link href="/" className="flex items-center gap-2.5 outline-none group" aria-label="Beranda Yomirra">
          <div className="flex size-7 items-center justify-center text-accent shrink-0 transition-transform duration-200 group-hover:scale-105">
            <BookOpen size={22} weight="fill" />
          </div>
          <span className="hidden xl:inline text-[19px] font-bold tracking-[-0.03em] text-text-primary">
            Yomirra<span className="text-accent font-black">.</span>
          </span>
        </Link>
      </div>

      <nav aria-label="Navigasi utama" className="flex flex-col gap-1">
        <span className="hidden xl:block px-2.5 pb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-text-muted/80">
          Jelajah
        </span>
        {MAIN_NAV_ITEMS.map(renderItem)}
      </nav>

      <nav aria-label="Navigasi lainnya" className="mt-4 flex flex-col gap-1 border-t border-border-subtle/60 pt-3.5">
        <span className="hidden xl:block px-2.5 pb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-text-muted/80">
          Lainnya
        </span>
        {MORE_ITEMS.map(renderItem)}
      </nav>

    </aside>
  );
}
