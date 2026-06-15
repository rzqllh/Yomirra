"use client";

import { useEffect } from "react";
import { WarningCircle, ArrowCounterClockwise } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Global Error Caught:", error);
  }, [error]);

  return (
    <div className="flex h-[80vh] w-full flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="rounded-full bg-semantic-error/10 p-6 text-semantic-error">
        <WarningCircle size={48} weight="duotone" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight text-text-primary">
          Terjadi Kesalahan
        </h2>
        <p className="max-w-md text-sm text-text-muted">
          Aplikasi mengalami masalah yang tidak terduga. Silakan coba muat ulang halaman atau kembali ke beranda.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 mt-4">
        <Button 
          variant="accent" 
          onClick={() => reset()}
          className="min-h-[44px] px-8 rounded-full shadow-sm"
        >
          <ArrowCounterClockwise className="mr-2 h-5 w-5" weight="bold" />
          Coba Lagi
        </Button>
        <Button 
          variant="outline" 
          onClick={() => window.location.href = '/'}
          className="min-h-[44px] px-8 rounded-full"
        >
          Kembali ke Beranda
        </Button>
      </div>
    </div>
  );
}
