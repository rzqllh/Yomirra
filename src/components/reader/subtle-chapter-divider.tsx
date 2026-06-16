import * as React from "react"

export function SubtleChapterDivider({ chapterId }: { chapterId: string }) {
  return (
    <div className="w-full py-12 flex justify-center items-center">
      <div className="h-[1px] w-1/3 bg-border-glass" />
      <span className="px-4 text-xs font-bold text-text-muted tracking-widest uppercase">
        Chapter {chapterId}
      </span>
      <div className="h-[1px] w-1/3 bg-border-glass" />
    </div>
  )
}
