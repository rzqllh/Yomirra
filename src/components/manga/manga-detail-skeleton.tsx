import * as React from "react";
import { PageHeader } from "@/components/app/header";
import { Skeleton } from "@/components/ui/skeleton";
import { MangaDetailLayout } from "./manga-detail-layout";

export function MangaDetailSkeleton() {
  return (
    <MangaDetailLayout
      backdrop={<div className="w-full h-full bg-neutral-900/90" />}
      header={<PageHeader title="" showBack={true} mode="detail" variant="transparent" />}
      mobileCover={<Skeleton className="w-full h-full rounded-none bg-white/10" />}
      mobileMeta={
        <>
          <Skeleton className="w-14 h-4 rounded-lg mb-2 bg-white/15" />
          <Skeleton className="w-full h-5 rounded-md mb-1.5 bg-white/20" />
          <Skeleton className="w-3/4 h-5 rounded-md mb-2.5 bg-white/20" />
          <div className="flex items-center gap-2 flex-wrap mb-2.5">
            <Skeleton className="w-12 h-5 rounded-lg bg-white/15" />
            <Skeleton className="w-16 h-5 rounded-lg bg-white/15" />
            <Skeleton className="w-20 h-5 rounded-lg bg-white/15" />
          </div>
          <div className="mt-auto flex flex-col gap-1">
            <Skeleton className="w-24 h-4 rounded-md bg-white/20" />
            <Skeleton className="w-36 h-3 rounded-md bg-white/15" />
          </div>
        </>
      }
      desktopCover={<Skeleton className="w-full h-full rounded-none bg-white/10" />}
      desktopMeta={
        <>
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="w-14 h-5 rounded-lg bg-white/15" />
            <Skeleton className="w-12 h-5 rounded-lg bg-white/15" />
            <Skeleton className="w-16 h-5 rounded-lg bg-white/15" />
            <Skeleton className="w-20 h-5 rounded-lg bg-white/15" />
          </div>
          <div className="my-1 space-y-2">
            <Skeleton className="w-2/3 h-10 rounded-xl bg-white/20" />
            <Skeleton className="w-1/3 h-4 rounded-md bg-white/15" />
          </div>
          <div className="flex flex-col gap-1">
            <Skeleton className="w-32 h-4 rounded-md bg-white/20" />
            <Skeleton className="w-48 h-3 rounded-md bg-white/15" />
          </div>
        </>
      }
      mainAction={
        <div className="w-full mt-2">
          <Skeleton className="w-full h-[52px] rounded-[16px] bg-white/20" />
        </div>
      }
      actions={
        <>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-10 w-full rounded-xl bg-white/15" />
          ))}
        </>
      }
      synopsis={
        <>
          <div className="flex items-center justify-between mb-2.5">
            <Skeleton className="h-3 w-16 rounded-md" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-full rounded-md" />
            <Skeleton className="h-3.5 w-[92%] rounded-md" />
            <Skeleton className="h-3.5 w-[85%] rounded-md" />
            <Skeleton className="h-3.5 w-[60%] rounded-md" />
          </div>
          <div className="mt-3.5 flex flex-wrap gap-1.5">
            <Skeleton className="h-6 w-16 rounded-xl" />
            <Skeleton className="h-6 w-20 rounded-xl" />
            <Skeleton className="h-6 w-14 rounded-xl" />
            <Skeleton className="h-6 w-18 rounded-xl" />
          </div>
        </>
      }
      chapters={
        <>
          <div className="sticky top-[60px] z-20 bg-surface-base py-3.5 px-0.5 border-b border-border-default/40 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-28 rounded-md" />
              <Skeleton className="h-6 w-20 rounded-lg" />
            </div>
            <Skeleton className="h-[42px] w-full rounded-xl" />
          </div>
          <div className="flex flex-col pt-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between py-4 px-1 border-b border-border-default/30">
                <div className="flex flex-col gap-2 flex-1 pr-4">
                  <Skeleton className="h-4 w-48 rounded-md" />
                  <Skeleton className="h-3 w-24 rounded-md" />
                </div>
                <Skeleton className="h-5 w-5 rounded-md shrink-0" />
              </div>
            ))}
          </div>
        </>
      }
      recommendations={
        <div className="mt-6 flex flex-col gap-3">
          <Skeleton className="h-5 w-36 rounded-md" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2">
                <Skeleton className="w-full aspect-[2/3] rounded-2xl" />
                <Skeleton className="h-3.5 w-3/4 rounded-md" />
                <Skeleton className="h-3 w-1/2 rounded-md" />
              </div>
            ))}
          </div>
        </div>
      }
    />
  );
}
