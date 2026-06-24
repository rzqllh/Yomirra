"use client";

import { useSourcePreferencesStore } from "@/shared/store/source-preferences-store";
import { useSettingsStore } from "@/shared/store/settings-store";
import { useNsfwSourceIds } from "@/shared/hooks/use-nsfw-source-ids";
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
  
  const isFromNsfwSource = isNsfw || nsfwSourceIds.has(sourceId);

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
