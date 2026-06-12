import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Riwayat - Yomirra",
  description: "Your reading history.",
};

export default function HistoryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
