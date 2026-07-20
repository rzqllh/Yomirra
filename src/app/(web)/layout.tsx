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
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: "Yomirra",
  description: "A source-powered reader for manga, comics, and webtoons.",
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
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

import { AppShell } from "@/components/app/app-shell";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { OfflineProvider } from "@/components/providers/offline-provider";
import { Toaster } from "@/components/ui/sonner";
import { DownloadManager } from "@/components/download/download-manager";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={plusJakartaSans.variable} suppressHydrationWarning>
      <body className="min-h-screen antialiased" suppressHydrationWarning>
        <Providers>
          <OfflineProvider>
            <div vaul-drawer-wrapper="" className="bg-background min-h-screen">
              <AppShell>
                <ErrorBoundary>
                  {children}
                  <Toaster position="top-center" />
                  <SpeedInsights />
                </ErrorBoundary>
              </AppShell>
            </div>
            <DownloadManager />
          </OfflineProvider>
        </Providers>
      </body>
    </html>
  );
}
