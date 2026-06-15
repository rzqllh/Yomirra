"use client";

import { useEffect } from "react";
import { WarningCircle } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/states/empty-state";

export default function ReaderError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Reader Error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4 bg-surface-base">
      <EmptyState
        icon={<WarningCircle size={48} weight="duotone" className="text-semantic-error" />}
        title="Terjadi Kesalahan"
        description="Maaf, terjadi masalah saat merender atau memuat pembaca chapter ini."
        action={
          <Button 
            onClick={() => reset()} 
            variant="outline" 
            className="rounded-full shadow-sm mt-4 font-bold px-6"
          >
            Coba Lagi
          </Button>
        }
      />
    </div>
  );
}
