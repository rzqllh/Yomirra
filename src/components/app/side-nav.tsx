"use client";

import { House, Books, Compass, Clock, Gear, BookBookmark, BookOpenText } from "@phosphor-icons/react";
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
    <div className="hidden md:flex w-[80px] lg:w-[240px] flex-col bg-surface-base border-r border-border-subtle h-screen fixed left-0 top-0 z-50 pt-0 pb-6 overflow-y-auto custom-scrollbar">
      {/* Logo Area */}
      <div className="flex h-16 items-center justify-center lg:justify-start px-4 mb-6 lg:px-6 sticky top-0 bg-surface-base z-10 border-b border-border-subtle/50">
        <Link href="/" className="flex items-center gap-3">
          <div className="relative flex size-9 items-center justify-center rounded-lg overflow-hidden shrink-0 shadow-sm">
            <Image src={Logo} alt="Yomirra Logo" fill sizes="36px" className="object-cover" />
          </div>
          <span className="text-[19px] font-black tracking-tight text-text-primary hidden lg:block">
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
                    "flex items-center justify-center lg:justify-start gap-3 rounded-lg px-3 py-2.5 transition-all duration-200",
                    isActive 
                      ? "bg-surface-raised text-text-primary font-bold shadow-sm" 
                      : "text-text-secondary hover:bg-surface-raised hover:text-text-primary font-medium"
                  )}
                  title={link.label}
                >
                  <Icon
                    className="h-5 w-5 shrink-0"
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
