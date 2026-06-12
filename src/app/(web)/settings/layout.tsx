import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pengaturan - Yomirra",
  description: "App settings and preferences.",
};

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
