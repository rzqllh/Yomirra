import { create } from 'zustand';

interface RouteState {
  scrollPositions: Record<string, number>;
  activeTabs: Record<string, string>;
  setScrollPosition: (path: string, position: number) => void;
  setActiveTab: (path: string, tabId: string) => void;
  getScrollPosition: (path: string) => number;
  getActiveTab: (path: string, defaultTab?: string) => string | undefined;
}

export const useRouteStateStore = create<RouteState>((set, get) => ({
  scrollPositions: {},
  activeTabs: {},
  
  setScrollPosition: (path, position) => set((state) => ({
    scrollPositions: { ...state.scrollPositions, [path]: position }
  })),
  
  setActiveTab: (path, tabId) => set((state) => ({
    activeTabs: { ...state.activeTabs, [path]: tabId }
  })),
  
  getScrollPosition: (path) => {
    return get().scrollPositions[path] || 0;
  },
  
  getActiveTab: (path, defaultTab) => {
    return get().activeTabs[path] || defaultTab;
  }
}));
