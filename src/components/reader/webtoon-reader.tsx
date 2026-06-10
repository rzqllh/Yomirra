import * as React from "react"
import { useReaderStore } from "@/shared/store/reader-store"
import { PageItem } from "@/shared/types/source"

export function WebtoonReader({ pages }: { pages: PageItem[] }) {
  const { settings, toggleOverlay } = useReaderStore()
  
  return (
    <div 
      className="flex min-h-screen w-full flex-col items-center select-none"
      onClick={toggleOverlay}
    >
      <div 
        className="flex w-full flex-col items-center pt-[calc(56px+env(safe-area-inset-top))]"
        style={{ maxWidth: settings.maxWidth ? `${settings.maxWidth}px` : '100%' }}
      >
        {pages.map((page) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img 
            key={page.index}
            src={page.url}
            alt={`Page ${page.index}`}
            className="w-full object-cover block m-0 p-0"
            loading="lazy"
          />
        ))}
      </div>
    </div>
  )
}
