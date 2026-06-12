import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sumber - Yomirra",
  description: "Manage manga sources.",
};

export default function SourcesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
