"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, DownloadSimple, GearSix, HardDrives, SidebarSimple } from "@phosphor-icons/react";
import { MAIN_NAV_ITEMS, type NavItem } from "@/shared/config/nav";
import { cn } from "@/shared/utils/cn";
import { beginNavigationIntent, getNavigationPathname } from "@/shared/lib/navigation-intent";
import { useSidebarStore } from "@/shared/store/sidebar-store";

const MORE_ITEMS: NavItem[] = [
  { href: "/sources", label: "Sumber", icon: HardDrives },
  { href: "/downloads", label: "Unduhan", icon: DownloadSimple },
  { href: "/settings", label: "Pengaturan", icon: GearSix },
];

export function DesktopRail({ pendingHref }: { pendingHref?: string | null } = {}) {
  const pathname = usePathname();
  const activePathname = pendingHref ? getNavigationPathname(pendingHref) : pathname;
  const { isCollapsed, toggleCollapsed } = useSidebarStore();

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "b") {
        if (typeof window !== "undefined" && window.innerWidth >= 1280) {
          event.preventDefault();
          toggleCollapsed();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleCollapsed]);

  const renderItem = (item: NavItem) => {
    const active = item.href === "/" ? activePathname === "/" : activePathname?.startsWith(item.href);
    const Icon = item.icon;

    return (
      <Link
        key={item.href}
        href={item.href}
        aria-label={item.label}
        aria-current={active ? "page" : undefined}
        title={item.label}
        onPointerDown={(e) => {
          // Prevent lingering mouse focus ring while preserving Tab keyboard navigation
          e.currentTarget.blur();
        }}
        onClick={(event) => {
          if (active || !beginNavigationIntent(item.href)) {
            event.preventDefault();
          }
        }}
        className={cn(
          "group flex min-h-[36px] items-center gap-2.5 rounded-xs px-2.5 py-1.5 transition-all duration-150 outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-accent active:ring-0",
          isCollapsed ? "justify-center" : "justify-center xl:justify-start",
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
        <span className={cn("hidden truncate text-[13px]", !isCollapsed && "xl:block")}>
          {item.label}
        </span>
      </Link>
    );
  };

  return (
    <aside
      style={{ top: "var(--announcement-height, 0px)" }}
      className={cn(
        "hidden md:flex fixed bottom-0 left-0 z-30 flex-col border-r border-border-subtle bg-surface-base px-2.5 py-4 transition-[width,top] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
        isCollapsed ? "w-[76px]" : "w-[76px] xl:w-[240px] xl:px-3.5"
      )}
    >
      {/* Brand Header */}
      <div
        className={cn(
          "flex items-center px-2 py-1 mb-5 shrink-0",
          isCollapsed ? "justify-center" : "justify-center xl:justify-start"
        )}
      >
        <Link href="/" className="flex items-center gap-2.5 outline-none group" aria-label="Beranda Yomirra">
          <div className="flex size-7 items-center justify-center text-accent shrink-0 transition-transform duration-200 group-hover:scale-105">
            <BookOpen size={22} weight="fill" />
          </div>
          <span
            className={cn(
              "hidden text-[19px] font-bold tracking-[-0.03em] text-text-primary",
              !isCollapsed && "xl:inline"
            )}
          >
            Yomirra<span className="text-accent font-black">.</span>
          </span>
        </Link>
      </div>

      <nav aria-label="Navigasi utama" className="flex flex-col gap-1">
        <span
          className={cn(
            "hidden px-2.5 pb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-text-muted/80",
            !isCollapsed && "xl:block"
          )}
        >
          Jelajah
        </span>
        {MAIN_NAV_ITEMS.map(renderItem)}
      </nav>

      <nav aria-label="Navigasi lainnya" className="mt-4 flex flex-col gap-1 border-t border-border-subtle/60 pt-3.5">
        <span
          className={cn(
            "hidden px-2.5 pb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-text-muted/80",
            !isCollapsed && "xl:block"
          )}
        >
          Lainnya
        </span>
        {MORE_ITEMS.map(renderItem)}
      </nav>

      {/* Bottom Controls / Toggle (Desktop >=1280px only) */}
      <div className="hidden xl:flex mt-auto pt-3 border-t border-border-subtle/60 flex-col gap-1 shrink-0">
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-expanded={!isCollapsed}
          aria-label={isCollapsed ? "Perluas bilah samping" : "Ciutkan bilah samping"}
          title={isCollapsed ? "Perluas bilah samping" : "Ciutkan bilah samping"}
          onPointerDown={(e) => {
            e.currentTarget.blur();
          }}
          className={cn(
            "group flex min-h-[44px] items-center gap-2.5 rounded-xs px-2.5 py-2 text-text-secondary hover:bg-surface-hover/70 hover:text-text-primary text-[13px] font-medium transition-all duration-150 outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-accent active:ring-0 cursor-pointer",
            isCollapsed ? "justify-center" : "justify-start w-full"
          )}
        >
          <SidebarSimple
            size={18}
            weight={isCollapsed ? "regular" : "duotone"}
            className={cn(
              "shrink-0 transition-transform duration-200 text-text-muted group-hover:text-text-primary",
              isCollapsed && "rotate-180"
            )}
          />
          {!isCollapsed && <span className="truncate">Ciutkan</span>}
        </button>
      </div>
    </aside>
  );
}
