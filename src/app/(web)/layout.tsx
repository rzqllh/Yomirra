import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

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
  maximumScale: 5,
  viewportFit: "cover",
};

import { AppShell } from "@/components/app/app-shell";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { OfflineProvider } from "@/components/providers/offline-provider";


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={plusJakartaSans.variable} suppressHydrationWarning>
      <body className="min-h-screen antialiased overflow-x-hidden" suppressHydrationWarning>
        <Providers>
          <OfflineProvider>
            <AppShell>
              <ErrorBoundary>
                {children}
              </ErrorBoundary>
            </AppShell>
          </OfflineProvider>
        </Providers>
      </body>
    </html>
  );
}
