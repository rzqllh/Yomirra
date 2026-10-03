import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sumber - Yomirra",
  description: "Atur sumber yang digunakan saat menjelajah dan membaca.",
};

export default function SourcesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
