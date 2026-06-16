import * as React from "react"
import { useRouter } from "next/navigation"
import { CaretLeft, CaretRight, List, CheckCircle } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { getMangaDetailHref, getReaderHref } from "@/shared/lib/routes"
import { toast } from "sonner"

interface EndOfChapterProps {
  sourceId: string;
  mangaId: string;
  chapterTitle: string;
  prevChapterId?: string;
  nextChapterId?: string;
  onOpenChapterList?: () => void;
}

export function EndOfChapter({
  sourceId,
  mangaId,
  chapterTitle,
  prevChapterId,
  nextChapterId,
  onOpenChapterList,
}: EndOfChapterProps) {
  const router = useRouter()

  return (
    <div className="w-full max-w-[600px] mx-auto px-4 py-12 pb-[calc(3rem+var(--safe-bottom))] flex flex-col items-center justify-center motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-8 transition-[transform,opacity,background-color] duration-150">
      <div className="bg-surface-raised border border-border-subtle rounded-xl shadow-lg p-8 w-full flex flex-col items-center text-center space-y-6">
        
        <div className="flex flex-col items-center space-y-2">
          <div className="size-12 rounded-full bg-semantic-success/10 text-semantic-success flex items-center justify-center mb-2">
            <CheckCircle size={28} weight="fill" />
          </div>
          <h3 className="text-xl font-bold text-text-primary">Selesai membaca</h3>
          <p className="text-sm font-medium text-text-muted">{chapterTitle}</p>
        </div>

        <div className="w-full h-px bg-border-subtle/50" />

        <p className="text-sm font-semibold text-text-primary">
          Lanjut ke chapter berikutnya?
        </p>

        <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Button 
            variant="secondary" 
            className="w-full justify-center rounded-full"
            disabled={!prevChapterId}
            onClick={() => {
              if (prevChapterId) {
                toast.info("Membuka chapter sebelumnya...", { duration: 2000 });
                router.push(getReaderHref(sourceId, mangaId, prevChapterId));
              }
            }}
          >
            <CaretLeft size={16} weight="bold" className="mr-2" />
            Sebelumnya
          </Button>

          <Button 
            variant="outline" 
            className="w-full justify-center rounded-full"
            onClick={() => {
              if (onOpenChapterList) {
                onOpenChapterList();
              } else {
                router.push(getMangaDetailHref(sourceId, mangaId));
              }
            }}
          >
            <List size={16} weight="bold" className="mr-2" />
            Daftar Chapter
          </Button>

          <Button 
            variant="default" 
            className="w-full justify-center rounded-full bg-accent hover:bg-accent/90 text-accent-on"
            disabled={!nextChapterId}
            onClick={() => {
              if (nextChapterId) {
                toast.info("Membuka chapter selanjutnya...", { duration: 2000 });
                router.push(getReaderHref(sourceId, mangaId, nextChapterId));
              }
            }}
          >
            Selanjutnya
            <CaretRight size={16} weight="bold" className="ml-2" />
          </Button>
        </div>

      </div>
    </div>
  )
}
