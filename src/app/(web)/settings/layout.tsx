import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pengaturan - Yomirra",
  description: "Atur tampilan, bacaan, dan data Yomirra.",
};

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
