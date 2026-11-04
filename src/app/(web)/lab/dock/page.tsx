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
  // Route is ONLY accessible in Development and Preview environments.
  // Unconditionally returns HTTP 404 in Production (NO bypass allowed).
  const isProduction =
    process.env.VERCEL_ENV === "production" ||
    (process.env.NODE_ENV === "production" && !process.env.VERCEL_ENV)

  if (isProduction) {
    notFound()
  }

  return <DockLabView />
}
