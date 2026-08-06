import { Metadata } from "next";
import { DesktopPageTitle } from "@/components/app/header";
import { Bell } from "@phosphor-icons/react/dist/ssr";
import { UpdatesList } from "@/components/updates/updates-list";

export const metadata: Metadata = {
  title: "Update Terbaru - Yomirra",
  description: "Daftar chapter terbaru dari manga di library Anda.",
};

export default function UpdatesPage() {
  return (
    <main className="min-h-screen bg-surface-base">
      <div className="px-4 pt-[calc(var(--safe-top)+24px)] pb-6 max-w-7xl mx-auto">
        <div className="mb-8">
          <DesktopPageTitle 
            title="Updates"
            description="Manga di library Anda yang memiliki chapter baru."
            icon={<Bell size={32} weight="duotone" />}
          />
        </div>
        
        <UpdatesList />
      </div>
    </main>
  );
}
