import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { DockLabView } from "./dock-lab-view"

export const metadata: Metadata = {
  title: "Dock Lab Showcase (10 Variants) | Yomirra Lab",
  description: "Internal preview and interactive benchmark for 10 bottom dock variants.",
  robots: {
    index: false,
    follow: false,
  },
}

export default function DockLabPage() {
  // Strict Production Isolation Guard:
  // In production builds, this route immediately returns 404 unless NEXT_PUBLIC_ENABLE_LAB is explicitly set.
  if (process.env.NODE_ENV === "production" && !process.env.NEXT_PUBLIC_ENABLE_LAB) {
    notFound()
  }

  return <DockLabView />
}
