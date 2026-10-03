import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Library - Yomirra",
  description: "Jelajahi katalog komik dari sumber yang kamu pilih.",
};

export default function LibraryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
