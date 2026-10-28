import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Unduhan - Yomirra",
  description: "Kelola chapter komik yang diunduh untuk dibaca secara offline.",
};

export default function DownloadsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
