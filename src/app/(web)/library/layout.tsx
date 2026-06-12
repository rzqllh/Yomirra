import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Library - Yomirra",
  description: "Browse the manga catalog.",
};

export default function LibraryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
