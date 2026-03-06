import { useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { usePromptsStore, useSettingsStore } from "#/stores";
import { getLLMClient, getApiKey } from "#/services/llm";
import { showToastOverlay, showReviewOverlay } from "#/services/overlayWindows";

interface HotkeyPayload {
  app: string;
  selected_text: string;
  target_pid: number;
}

export function useAICompletionListener() {
  useEffect(() => {
    const unlisten = listen<HotkeyPayload>(
      "raypaste://hotkey-triggered",
      async (event) => {
        const { app, selected_text, target_pid } = event.payload;

        if (!selected_text.trim()) {
          showToastOverlay(
            "No text selected. Select some text and try again.",
            "error",
          );
          return;
        }

        const promptsState = usePromptsStore.getState();
        const prompt =
          promptsState.getPromptForApp(app) ??
          promptsState.prompts.find((p) => p.id === "formal") ??
          promptsState.prompts[0];

        if (!prompt) {
          showToastOverlay(
            "No prompt configured. Create one in New Prompt.",
            "error",
          );
          return;
        }

        const apiKey = getApiKey();
        if (!apiKey) {
          showToastOverlay(
            "No API key set. Go to Settings to add one.",
            "error",
          );
          return;
        }

        await useSettingsStore.persist.rehydrate();
        const { model, reviewMode } = useSettingsStore.getState();

        try {
          const t0 = Date.now();
          const result = await getLLMClient().complete(
            {
              messages: [
                { role: "system", content: prompt.text },
                { role: "user", content: selected_text },
              ],
              model,
            },
            apiKey,
          );
          const durationMs = Date.now() - t0;

          if (reviewMode) {
            showReviewOverlay({
              completedText: result,
              originalText: selected_text,
              targetPid: target_pid,
              durationMs,
            });
          } else {
            await invoke("write_text_back", {
              text: result,
              targetPid: target_pid,
            });
          }
        } catch (err) {
          showToastOverlay(
            `Error: ${err instanceof Error ? err.message : String(err)}`,
            "error",
          );
        }
      },
    );

    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);
}
