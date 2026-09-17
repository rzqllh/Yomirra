"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { WarningCircle, ArrowClockwise, ArrowLeft, MagnifyingGlass, Gear } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/app/header";
import { getSourceMetadata } from "@/shared/sources/source-registry";
import Link from "next/link";

interface MangaDetailErrorStateProps {
  sourceId: string;
  mangaId: string;
  type: "not_found" | "network_error" | "disabled";
  message?: string;
}

export function MangaDetailErrorState({
  sourceId,
  mangaId,
  type,
  message,
}: MangaDetailErrorStateProps) {
  const router = useRouter();
  const [isRetrying, setIsRetrying] = React.useState(false);

  const sourceMeta = getSourceMetadata(sourceId);
  const sourceName = sourceMeta?.name ?? sourceId;

  const handleRetry = () => {
    setIsRetrying(true);
    router.refresh();
    setTimeout(() => setIsRetrying(false), 2000);
  };

  const isNotFound = type === "not_found";
  const isDisabled = type === "disabled";

  const title = isDisabled
    ? `Sumber "${sourceName}" Dinonaktifkan`
    : isNotFound
    ? "Manga Tidak Ditemukan"
    : `Gagal Terhubung ke ${sourceName}`;

  const description = isDisabled
    ? "Sumber komik ini sedang dinonaktifkan di pengaturan aplikasi Anda. Anda dapat mengaktifkannya kembali untuk membaca komik ini."
    : isNotFound
    ? `Komik dengan ID "${mangaId}" tidak ditemukan atau telah dihapus pada ${sourceName}. Anda dapat mencari judul ini di sumber lain.`
    : (message || `Terjadi kesalahan saat memuat data dari ${sourceName}. Server sumber mungkin sedang mengalami gangguan atau koneksi terputus.`);

  return (
    <main className="min-h-screen flex flex-col w-full relative pb-24">
      <div className="md:hidden">
        <div className="px-4 pt-[calc(var(--mobile-header-height,56px)+var(--safe-top,0px)+16px)] md:px-8 md:pt-8">
          <PageHeader title={title} showBack={true} />
        </div>
      </div>

      <div className="w-full max-w-lg mx-auto px-4 pt-16 md:pt-24 flex flex-col items-center">
        <div className="w-full bg-surface-raised border border-border-subtle rounded-2xl p-6 md:p-8 shadow-sm flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-accent-dim text-accent flex items-center justify-center mb-4">
            {isDisabled ? (
              <Gear size={28} weight="duotone" />
            ) : isNotFound ? (
              <MagnifyingGlass size={28} weight="duotone" />
            ) : (
              <WarningCircle size={28} weight="duotone" className="text-semantic-warning" />
            )}
          </div>

          <h1 className="text-xl md:text-2xl font-bold text-text-primary mb-2">
            {title}
          </h1>

          <p className="text-sm text-text-muted leading-relaxed mb-6 max-w-sm">
            {description}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
            {isDisabled ? (
              <Button asChild variant="primary" className="gap-2 w-full sm:w-auto font-bold">
                <Link href="/settings">
                  <Gear size={18} weight="bold" />
                  Buka Pengaturan
                </Link>
              </Button>
            ) : isNotFound ? (
              <Button asChild variant="primary" className="gap-2 w-full sm:w-auto font-bold">
                <Link href={`/search?q=${encodeURIComponent(mangaId.replace(/[-_]/g, ' '))}`}>
                  <MagnifyingGlass size={18} weight="bold" />
                  Cari di Sumber Lain
                </Link>
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handleRetry}
                loading={isRetrying}
                className="gap-2 w-full sm:w-auto font-bold"
              >
                <ArrowClockwise size={18} weight="bold" />
                Coba Lagi
              </Button>
            )}

            <Button
              variant="outline"
              onClick={() => router.back()}
              className="gap-2 w-full sm:w-auto"
            >
              <ArrowLeft size={18} />
              Kembali
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
