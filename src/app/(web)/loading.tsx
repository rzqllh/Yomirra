import { HomeView } from "@/components/app/home-view";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <HomeView>
      <div className="flex flex-col gap-11 sm:gap-12 pb-16">
        <Skeleton className="min-h-[300px] w-full rounded-3xl sm:min-h-[320px] md:min-h-[275px]" />

        <section className="flex flex-col gap-4">
          <Skeleton className="h-7 w-52 rounded-lg" />
          <div className="grid gap-4 sm:gap-5 lg:grid-cols-[minmax(0,1.38fr)_minmax(290px,0.82fr)]">
            <Skeleton className="min-h-[300px] w-full rounded-[18px]" />
            <Skeleton className="min-h-[300px] w-full rounded-[18px]" />
          </div>
        </section>

        <section className="space-y-4">
          <Skeleton className="h-6 w-36 rounded-lg" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-32 w-full rounded-xl" />
            ))}
          </div>
        </section>
      </div>
    </HomeView>
  );
}
