"use client"

import * as React from "react"
import Image from "next/image"

interface ReaderPreloaderProps {
  urls: string[]
  dataSaver: boolean
}

export const ReaderPreloader = React.memo(function ReaderPreloader({ urls, dataSaver }: ReaderPreloaderProps) {
  // Melacak jumlah gambar yang sudah berhasil diload atau error
  const [loadedCount, setLoadedCount] = React.useState(0)

  // Mount gambar secara berurutan. slice(0, loadedCount + 1) berarti kita hanya me-mount
  // gambar-gambar yang sudah selesai + 1 gambar baru yang sedang mengantri untuk didownload.
  const activeUrls = urls.slice(0, loadedCount + 1)

  return (
    <div className="hidden" aria-hidden="true" style={{ display: 'none' }}>
      {activeUrls.map((url, i) => (
        <Image 
          key={url}
          src={url}
          alt={`preload-${i}`}
          width={800}
          height={1200}
          quality={dataSaver ? 60 : 85}
          unoptimized={!dataSaver}
          loading="eager"
          // Memicu gambar selanjutnya setelah gambar ini selesai
          onLoad={() => setLoadedCount(c => Math.max(c, i + 1))}
          onError={() => setLoadedCount(c => Math.max(c, i + 1))}
        />
      ))}
    </div>
  )
})
