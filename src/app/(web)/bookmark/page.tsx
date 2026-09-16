"use client";

import * as React from "react";
import { BookmarkPageView } from "@/components/bookmark/bookmark-page-view";

export default function BookmarkPage() {
  return (
    <React.Suspense fallback={null}>
      <BookmarkPageView />
    </React.Suspense>
  );
}

