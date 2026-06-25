import * as React from "react";
import Link from "next/link";
import { MangaItem } from "@/shared/types/source";
import { getMangaDetailHref } from "@/shared/lib/routes";
import { HorizontalScrollContainer } from "@/components/ui/horizontal-scroll-container";

interface PopularCarouselProps {
  mangas: MangaItem[];
  sourceId: string;
}

export function PopularCarousel({ mangas, sourceId }: PopularCarouselProps) {
  if (!mangas || mangas.length === 0) return null;

  return (
    <HorizontalScrollContainer className="pb-4 pt-2 -mx-4 px-4 md:mx-0 md:px-0">
      <div className="flex gap-4 sm:gap-6">
        {mangas.slice(0, 15).map((manga, index) => (
          <Link 
            key={manga.id}
            href={getMangaDetailHref(sourceId, manga.id)}
            className={`group relative flex-shrink-0 w-[120px] sm:w-[140px] lg:w-[160px] flex flex-col ${index === 0 ? 'ml-6 sm:ml-8' : ''}`}
          >
            {/* Rank Badge (Behind Card) */}
            <div className="absolute -left-3 sm:-left-4 top-12 z-0 font-black text-[100px] sm:text-[120px] leading-none text-surface-overlay drop-shadow-md select-none opacity-80" style={{ WebkitTextStroke: '1px rgba(255,255,255,0.1)' }}>
              {index + 1}
            </div>

            {/* Cover Art */}
            <div className="relative z-10 w-full aspect-[2/3] rounded-xl overflow-hidden bg-surface-raised border border-border-subtle shadow-md group-hover:-translate-y-2 group-hover:shadow-xl transition-all duration-300">
              {/* Fallback to simple img tag for safety, or quote the URL */}
              <img 
                src={manga.coverUrl || ""} 
                alt={manga.title} 
                loading="lazy"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>

            {/* Title (Hidden by default, shown on hover/focus if needed, but for ranked lists often implied. Let's show a subtle title) */}
            <div className="relative z-10 mt-3 px-1">
              <h3 className="text-sm font-bold text-text-primary line-clamp-2 group-hover:text-accent transition-colors">
                {manga.title}
              </h3>
            </div>
          </Link>
        ))}
      </div>
    </HorizontalScrollContainer>
  );
}
