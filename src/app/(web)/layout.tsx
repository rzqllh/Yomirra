import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { SpeedInsights } from "@vercel/speed-insights/next";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-ui",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://www.yomirra.web.id"),
  title: "Yomirra",
  description: "Baca komik dari berbagai sumber dalam satu aplikasi.",
  appleWebApp: {
    capable: true,
    title: "Yomirra",
    statusBarStyle: "black-translucent",
  },
};

import type { Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

import { AppShell } from "@/components/app/app-shell";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { OfflineProvider } from "@/components/providers/offline-provider";
import { Toaster } from "@/components/ui/sonner";
import { DownloadManager } from "@/components/download/download-manager";
import { BootGate } from "@/components/app/boot-gate";
import { SiteAnnouncementBanner } from "@/components/layout/site-announcement-banner";

export default function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal?: React.ReactNode;
}>) {
  return (
    <html lang="id" className={plusJakartaSans.variable} suppressHydrationWarning>
      <body className="min-h-dvh antialiased" suppressHydrationWarning>
        <Providers>
          <OfflineProvider>
            <div vaul-drawer-wrapper="" className="bg-background min-h-dvh">
              <SiteAnnouncementBanner />
              <BootGate>
                <AppShell>
                  <ErrorBoundary>
                    {children}
                    {modal}
                    <SpeedInsights />
                  </ErrorBoundary>
                </AppShell>
              </BootGate>
            </div>
            <Toaster />
            <DownloadManager />
          </OfflineProvider>
        </Providers>
      </body>
    </html>
  );
}
