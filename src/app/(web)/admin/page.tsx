import { Metadata } from "next";
import { AdminLayout } from "@/components/admin/admin-layout";

export const metadata: Metadata = {
  title: "Admin Portal · Yomirra Ops",
  description: "Pusat kendali operasional, source engine, telemetri, dan moderasi Yomirra.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminPage() {
  return <AdminLayout />;
}
