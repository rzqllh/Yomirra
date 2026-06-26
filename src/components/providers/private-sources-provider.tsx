"use client";

import { useEffect } from "react";
import { useAuth } from "@/shared/hooks/use-auth";
import { dynamicSourceRegistry } from "@/shared/sources/dynamic-source-registry";
import { useSettingsStore } from "@/shared/store/settings-store";

export function PrivateSourcesProvider({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const isGodMode = useSettingsStore(state => state.isGodMode);
  const setGodMode = useSettingsStore(state => state.setGodMode);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      // Clear private sources on logout and enforce God Mode turning off
      // per user requirement: God mode is strictly for authorized logged-in users.
      dynamicSourceRegistry.setVolatileSources([]);
      if (isGodMode) setGodMode(false);
      document.body.classList.remove("theme-god-mode");
      return;
    }

    if (isGodMode && user.email) {
      // Fetch private sources
      fetch("/api/sources/private", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: user.email }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.authorized) {
            // Authorized! Keep God Mode on, set sources if any.
            if (data.sources && Array.isArray(data.sources) && data.sources.length > 0) {
              dynamicSourceRegistry.setVolatileSources(data.sources);
            }
            document.body.classList.add("theme-god-mode");
          } else {
            // Unauthorized or mismatched email -> turn off God Mode
            setGodMode(false);
            document.body.classList.remove("theme-god-mode");
          }
        })
        .catch((e) => {
          console.error("Failed to load private sources", e);
          setGodMode(false);
          document.body.classList.remove("theme-god-mode");
        });
    } else {
      // God mode turned off
      dynamicSourceRegistry.setVolatileSources([]);
      document.body.classList.remove("theme-god-mode");
    }
  }, [user, isGodMode, setGodMode]);

  return <>{children}</>;
}
