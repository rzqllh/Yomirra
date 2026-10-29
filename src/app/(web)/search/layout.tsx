import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cari Komik - Yomirra",
  description: "Cari judul komik dari seluruh sumber aktif.",
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
