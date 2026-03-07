import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Prompt {
  id: string;
  name: string;
  text: string;
  notes: string;
  appIds: string[];
}

interface PromptsState {
  prompts: Prompt[];
  defaultPromptId: string | null;
  addPrompt: (prompt: {
    id?: string;
    name: string;
    text: string;
    notes?: string;
  }) => void;
  updatePrompt: (id: string, updates: Partial<Omit<Prompt, "id">>) => void;
  deletePrompt: (id: string) => void;
  assignAppToPrompt: (promptId: string, appId: string) => void;
  unassignApp: (appId: string) => void;
  getPromptForApp: (appId: string) => Prompt | undefined;
  setDefaultPrompt: (id: string | null) => void;
}

export const usePromptsStore = create<PromptsState>()(
  persist(
    (set, get) => ({
      prompts: [
        {
          id: "formal",
          name: "Formal",
          text: "Make this text more formal",
          notes: "",
          appIds: [],
        },
      ],
      defaultPromptId: null,
      addPrompt: ({ id, name, text, notes = "" }) =>
        set((state) => ({
          prompts: [
            ...state.prompts,
            { id: id ?? crypto.randomUUID(), name, text, notes, appIds: [] },
          ],
        })),
      updatePrompt: (id, updates) =>
        set((state) => ({
          prompts: state.prompts.map((p) =>
            p.id === id ? { ...p, ...updates } : p,
          ),
        })),
      deletePrompt: (id) =>
        set((state) => ({
          prompts: state.prompts.filter((p) => p.id !== id),
        })),
      assignAppToPrompt: (promptId, appId) =>
        set((state) => ({
          prompts: state.prompts.map((p) => {
            if (p.id === promptId) {
              return {
                ...p,
                appIds: [...p.appIds.filter((id) => id !== appId), appId],
              };
            }
            return { ...p, appIds: p.appIds.filter((id) => id !== appId) };
          }),
        })),
      unassignApp: (appId) =>
        set((state) => ({
          prompts: state.prompts.map((p) => ({
            ...p,
            appIds: p.appIds.filter((id) => id !== appId),
          })),
        })),
      getPromptForApp: (appId) =>
        get().prompts.find((p) => p.appIds.includes(appId)),
      setDefaultPrompt: (id) => set({ defaultPromptId: id }),
    }),
    { name: "raypaste-prompts" },
  ),
);
