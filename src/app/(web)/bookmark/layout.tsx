import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rak Buku - Yomirra",
  description: "Koleksi komik dan bookmark yang kamu simpan.",
};

export default function BookmarkLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
