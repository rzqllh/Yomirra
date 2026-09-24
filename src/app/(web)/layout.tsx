import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Newsreader, Yuji_Boku } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { SpeedInsights } from "@vercel/speed-insights/next";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-ui",
  subsets: ["latin"],
});
const yujiBoku = Yuji_Boku({ variable: "--font-editorial", weight: "400", subsets: ["latin"] });
const newsreader = Newsreader({ variable: "--font-caption", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://yomirra.vercel.app"),
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
  viewportFit: "cover",
};

import { AppShell } from "@/components/app/app-shell";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { OfflineProvider } from "@/components/providers/offline-provider";
import { Toaster } from "@/components/ui/sonner";
import { DownloadManager } from "@/components/download/download-manager";
import { BootGate } from "@/components/app/boot-gate";

export default function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal?: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${plusJakartaSans.variable} ${yujiBoku.variable} ${newsreader.variable}`} suppressHydrationWarning>
      <body className="min-h-dvh antialiased" suppressHydrationWarning>
        <Providers>
          <OfflineProvider>
            <div vaul-drawer-wrapper="" className="bg-background min-h-dvh">
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
            <Toaster position="bottom-right" />
            <DownloadManager />
          </OfflineProvider>
        </Providers>
      </body>
    </html>
  );
}
