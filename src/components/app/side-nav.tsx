"use client";

import { House, Books, Compass, Clock, Gear, BookBookmark } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/shared/utils/cn";
import Image from "next/image";
import Logo from '@/logo/icon.png';

export function SideNav() {
  const pathname = usePathname();

  const navGroups = [
    {
      title: "Discover",
      links: [
        { href: "/", label: "Beranda", icon: House },
        { href: "/library", label: "Library", icon: Books },
      ]
    },
    {
      title: "Collection",
      links: [
        { href: "/readlist", label: "Readlist", icon: BookBookmark },
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
    <div className="hidden md:flex w-[80px] lg:w-[240px] flex-col bg-surface-base border-r border-border-subtle shadow-md h-screen fixed left-0 top-0 z-50 pt-0 pb-6 overflow-y-auto custom-scrollbar transition-all duration-300">
      {/* Logo Area */}
      <div className="flex h-16 items-center justify-center lg:justify-start px-4 mb-6 lg:px-6 sticky top-0 z-10 bg-surface-base">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative flex size-9 items-center justify-center rounded-xl overflow-hidden shrink-0 shadow-sm ring-1 ring-border-subtle transition-transform duration-300 group-hover:scale-105">
            <Image src={Logo} alt="Yomirra Logo" fill sizes="36px" className="object-cover" />
          </div>
          <span className="text-xl font-black tracking-tight text-text-primary hidden lg:block transition-colors group-hover:text-accent">
            Yomirra
          </span>
        </Link>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 flex flex-col gap-8 px-4">
        {navGroups.map((group, i) => (
          <div key={i} className="flex flex-col gap-1.5">
            <span className="hidden lg:block px-3 text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1">
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
                    "relative flex items-center justify-center lg:justify-start gap-3 rounded-xl px-3 py-2.5 transition-all duration-150 ease-out overflow-hidden group outline-none",
                    isActive 
                      ? "bg-accent-dim text-accent font-bold" 
                      : "text-text-secondary hover:bg-surface-hover hover:text-text-primary font-medium"
                  )}
                  title={link.label}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1/2 bg-accent rounded-r-full" />
                  )}
                  <Icon
                    className={cn(
                      "h-5 w-5 shrink-0 relative z-10 transition-transform duration-150",
                      isActive ? "scale-110" : "group-hover:scale-110"
                    )}
                    weight={isActive ? "fill" : "duotone"}
                  />
                  <span className="text-sm hidden lg:block leading-none mt-0.5 relative z-10">{link.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}