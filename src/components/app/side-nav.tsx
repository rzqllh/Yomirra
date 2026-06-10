"use client";

import { House, Books, Compass, Clock, Gear, Sparkle, Fire } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/shared/utils/cn";

export function SideNav() {
  const pathname = usePathname();

  const navGroups = [
    {
      title: "Discover",
      links: [
        { href: "/", label: "Beranda", icon: House },
        { href: "/updates", label: "Update Terbaru", icon: Sparkle },
        { href: "/popular", label: "Populer", icon: Fire },
      ]
    },
    {
      title: "Collection",
      links: [
        { href: "/library", label: "Library", icon: Books },
        { href: "/history", label: "Riwayat", icon: Clock },
      ]
    },
    {
      title: "Sources",
      links: [
        { href: "/sources", label: "Sumber", icon: Compass },
      ]
    },
    {
      title: "Preferences",
      links: [
        { href: "/settings", label: "Pengaturan", icon: Gear },
      ]
    }
  ];

  return (
    <div className="hidden md:flex w-[80px] lg:w-[240px] flex-col bg-surface-base border-r border-border-subtle h-screen fixed left-0 top-0 z-50 pt-0 pb-6 overflow-y-auto">
      {/* Logo Area */}
      <div className="flex h-16 items-center justify-center lg:justify-start px-4 mb-4 lg:px-6 sticky top-0 bg-surface-base z-10 border-b border-transparent">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-lg bg-accent">
            <span className="text-xl font-bold text-accent-foreground">Y</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-text-primary hidden lg:block">
            Yomirra
          </span>
        </Link>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 flex flex-col gap-6 px-3">
        {navGroups.map((group, i) => (
          <div key={i} className="flex flex-col gap-1">
            <span className="hidden lg:block px-3 text-[11px] font-bold uppercase tracking-wider text-text-muted mb-1">
              {group.title}
            </span>
            {group.links.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || (link.href !== "/" && pathname?.startsWith(link.href));

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center justify-center lg:justify-start gap-3 rounded-md px-3 py-2.5 transition-colors duration-200",
                    isActive 
                      ? "bg-accent/10 text-accent font-semibold" 
                      : "text-text-primary hover:bg-surface-overlay hover:text-text-primary font-medium"
                  )}
                  title={link.label}
                >
                  <Icon
                    className="h-[22px] w-[22px] shrink-0"
                    weight={isActive ? "fill" : "regular"}
                  />
                  <span className="text-[14px] hidden lg:block leading-none mt-0.5">{link.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
