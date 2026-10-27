"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider, useTheme } from "next-themes";
import { useState, useEffect } from "react";

import { MotionProvider } from "@/components/motion/motion-provider";

function ThemeColorSync() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!resolvedTheme) return;
    const color = resolvedTheme === "dark" ? "#090a0f" : "#f8f6f1";

    let defaultMeta = document.querySelector("meta[name=\"theme-color\"]:not([media])");
    if (!defaultMeta) {
      defaultMeta = document.createElement("meta");
      defaultMeta.setAttribute("name", "theme-color");
      document.head.appendChild(defaultMeta);
    }
    defaultMeta.setAttribute("content", color);

    const lightMeta = document.querySelector("meta[name=\"theme-color\"][media*=\"light\"]");
    const darkMeta = document.querySelector("meta[name=\"theme-color\"][media*=\"dark\"]");
    if (resolvedTheme === "dark") {
      if (lightMeta) lightMeta.setAttribute("content", "#090a0f");
      if (darkMeta) darkMeta.setAttribute("content", "#090a0f");
    } else if (resolvedTheme === "light") {
      if (lightMeta) lightMeta.setAttribute("content", "#f8f6f1");
      if (darkMeta) darkMeta.setAttribute("content", "#f8f6f1");
    }
  }, [resolvedTheme]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 15,
            gcTime: 1000 * 60 * 60,
            refetchOnWindowFocus: false,
            refetchOnMount: false,
            refetchOnReconnect: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <ThemeColorSync />
      <QueryClientProvider client={queryClient}>
        <MotionProvider>
          {children}
        </MotionProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
