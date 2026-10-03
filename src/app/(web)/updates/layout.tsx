import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Jadwal Mingguan - Yomirra",
  description: "Lihat perkiraan jadwal chapter baru dari komik yang kamu simpan.",
};

export default function UpdatesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
