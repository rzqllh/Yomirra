import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Akun & Sinkronisasi - Yomirra",
  description: "Kelola akun Google dan sinkronisasi data bacaan.",
};

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
