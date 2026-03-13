import { create } from "zustand";
import { persist } from "zustand/middleware";
import { LLM_PROVIDER, type LLMProvider } from "#/services/llm/types";

export type ThemeMode = "light" | "dark" | "auto";

interface SettingsState {
  mode: "direct" | "api";
  provider: LLMProvider;
  openrouterApiKey: string;
  cerebrasApiKey: string;
  model: string;
  reviewMode: boolean;
  themeMode: ThemeMode;
  setMode: (mode: "direct" | "api") => void;
  setProvider: (provider: LLMProvider) => void;
  setOpenrouterApiKey: (key: string) => void;
  setCerebrasApiKey: (key: string) => void;
  setReviewMode: (reviewMode: boolean) => void;
  setThemeMode: (themeMode: ThemeMode) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      mode: "direct",
      provider: LLM_PROVIDER.OpenRouter,
      openrouterApiKey: "",
      cerebrasApiKey: "",
      model: "openai/gpt-oss-120b",
      reviewMode: false,
      themeMode: "auto",
      setMode: (mode) => set({ mode }),
      setProvider: (provider) => set({ provider }),
      setOpenrouterApiKey: (openrouterApiKey) => set({ openrouterApiKey }),
      setCerebrasApiKey: (cerebrasApiKey) => set({ cerebrasApiKey }),
      setReviewMode: (reviewMode) => set({ reviewMode }),
      setThemeMode: (themeMode) => set({ themeMode }),
    }),
    {
      name: "raypaste-settings",
      merge: (persistedState, currentState) => {
        const persisted = (persistedState ?? {}) as Partial<SettingsState> & {
          reviewMode?: unknown;
        };

        return {
          ...currentState,
          ...persisted,
          reviewMode:
            typeof persisted.reviewMode === "boolean"
              ? persisted.reviewMode
              : currentState.reviewMode,
        };
      },
    },
  ),
);
