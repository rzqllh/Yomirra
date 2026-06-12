import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Readlist - Yomirra",
  description: "Your saved manga and comics.",
};

export default function ReadlistLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
