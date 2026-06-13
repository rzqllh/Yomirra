"use client";

import React, { createContext, useContext, useState } from "react";

export type NavStyle = 'apple-glass' | 'vercel' | 'floating' | 'minimal' | 'fluid-line';

interface DemoLayoutContextType {
  mode: NavStyle;
  setMode: (mode: NavStyle) => void;
}

const DemoLayoutContext = createContext<DemoLayoutContextType | undefined>(undefined);

export function DemoLayoutProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<NavStyle>('apple-glass');

  // Floating switcher
  return (
    <DemoLayoutContext.Provider value={{ mode, setMode }}>
      {children}
    </DemoLayoutContext.Provider>
  );
}

export function useDemoLayout() {
  const context = useContext(DemoLayoutContext);
  if (!context) return { mode: 'apple-glass' as NavStyle, setMode: () => {} };
  return context;
}
