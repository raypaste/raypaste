import { create } from "zustand";

export interface InstalledApp {
  name: string;
  bundleId: string;
  /** Path to already-converted cached PNG. Present on warm cache hits. */
  iconPath?: string;
  /** Path to raw .icns file. Present when PNG is not yet cached. */
  icnsPath?: string;
}

interface AppsState {
  apps: InstalledApp[];
  activeApp: string | null;
  setApps: (apps: InstalledApp[]) => void;
  setActiveApp: (appId: string | null) => void;
}

export const useAppsStore = create<AppsState>()((set) => ({
  apps: [],
  activeApp: null,
  setApps: (apps) => set({ apps }),
  setActiveApp: (activeApp) => set({ activeApp }),
}));
