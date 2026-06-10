import Image from "next/image";
import Link from "next/link";

import type { MangaItem } from "@/shared/types/source";

interface MangaCardProps {
  manga: MangaItem;
  sourceId: string;
  priority?: boolean;
}

import { getMangaDetailHref } from "@/shared/lib/routes";

export function MangaCard({ manga, sourceId, priority = false }: MangaCardProps) {
  const coverUrl = manga.coverUrl;

  return (
    <Link href={getMangaDetailHref(sourceId, manga.id)} className="group relative block aspect-[2/3] w-full overflow-hidden rounded-2xl">
      <Image
        src={coverUrl}
        alt={manga.title}
        fill
        className="object-cover transition-transform duration-500 group-hover:scale-110"
        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
        priority={priority}
      />
      
      {/* Gradient overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      {/* Glass overlay info panel */}
      <div className="absolute bottom-2 left-2 right-2 translate-y-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
        <div   className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-3">
          <h3 className="line-clamp-2 text-sm font-semibold text-white">
            {manga.title}
          </h3>
          {manga.status && (
            <span className="mt-1 inline-block rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-medium text-white/90">
              {manga.status}
            </span>
          )}
        </div>
      </div>
      
      {/* Mobile persistent title */}
      <div className="absolute bottom-0 left-0 right-0 p-3 lg:hidden">
        <h3 className="line-clamp-2 text-sm font-semibold text-white text-shadow-sm">
          {manga.title}
        </h3>
      </div>
    </Link>
  );
}
