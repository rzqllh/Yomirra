import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Update Terbaru - Yomirra",
  description: "Daftar chapter terbaru dari manga di library Anda.",
};

export default function UpdatesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
