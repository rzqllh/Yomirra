"use client";

import { useSourcePreferencesStore } from "@/shared/store/source-preferences-store";
import { useSettingsStore } from "@/shared/store/settings-store";
import { useNsfwSourceIds } from "@/shared/hooks/use-nsfw-source-ids";
import { dynamicSourceRegistry } from "@/shared/sources/dynamic-source-registry";
import * as React from "react";

interface SourceFeedWrapperProps {
  sourceId: string;
  isNsfw: boolean;
  children: React.ReactNode;
}

export function SourceFeedWrapper({ sourceId, isNsfw, children }: SourceFeedWrapperProps) {
  const { isSourceDisabled } = useSourcePreferencesStore();
  const hideNsfw = useSettingsStore(state => state.hideNsfw);
  const nsfwSourceIds = useNsfwSourceIds();
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);
  
  const isFromNsfwSource = isNsfw || nsfwSourceIds.has(sourceId);

  // During SSR/Hydration, we must match the server output to avoid hydration mismatch.
  // The server renders assuming defaults: hideNsfw = true, isSourceDisabled = false.
  if (!isMounted) {
    if (isNsfw) return null;
    return <>{children}</>;
  }

  // If God mode is OFF and this is an NSFW source, hide it completely from Homepage
  if (hideNsfw && isFromNsfwSource) {
    return null;
  }

  // If the user has toggled this source OFF, hide it
  if (isSourceDisabled(sourceId)) {
    return null;
  }

  return <>{children}</>;
}
