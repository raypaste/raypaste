import { useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { emit } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { usePromptsStore, useSettingsStore } from "#/stores";
import { getLLMClient, getApiKey } from "#/services/llm";
import { showToastOverlay, showReviewOverlay } from "#/services/overlayWindows";
import { saveCompletion, updateCompletionOutcome } from "#/services/db";

interface HotkeyPayload {
  app: string;
  selected_text: string;
  target_pid: number;
}

interface ReviewOutcomePayload {
  completionId: string;
  finalText: string | null;
  wasApplied: boolean;
}

export function useAICompletionListener() {
  useEffect(() => {
    const unlistenHotkey = listen<HotkeyPayload>(
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
        const { model, provider, reviewMode } = useSettingsStore.getState();

        const completionId = crypto.randomUUID();
        const t0 = Date.now();

        try {
          const completion = await getLLMClient().complete(
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
            await saveCompletion({
              id: completionId,
              timestamp: t0,
              inputText: selected_text,
              outputText: completion.text,
              finalText: null,
              wasApplied: 0,
              isReviewMode: 1,
              hadError: 0,
              errorMessage: null,
              inputTokens: completion.usage.input_tokens,
              outputTokens: completion.usage.output_tokens,
              completionMs: durationMs,
              appId: app,
              promptId: prompt.id,
              promptName: prompt.name,
              promptText: prompt.text,
              model,
              provider,
            });
            await emit("raypaste://completion-saved");

            showReviewOverlay({
              completionId,
              completedText: completion.text,
              originalText: selected_text,
              targetPid: target_pid,
              durationMs,
            });
          } else {
            await invoke("write_text_back", {
              text: completion.text,
              targetPid: target_pid,
            });

            await saveCompletion({
              id: completionId,
              timestamp: t0,
              inputText: selected_text,
              outputText: completion.text,
              finalText: null,
              wasApplied: 1,
              isReviewMode: 0,
              hadError: 0,
              errorMessage: null,
              inputTokens: completion.usage.input_tokens,
              outputTokens: completion.usage.output_tokens,
              completionMs: durationMs,
              appId: app,
              promptId: prompt.id,
              promptName: prompt.name,
              promptText: prompt.text,
              model,
              provider,
            });
            await emit("raypaste://completion-saved");
          }
        } catch (err) {
          const durationMs = Date.now() - t0;
          const errorMessage = err instanceof Error ? err.message : String(err);

          showToastOverlay(`Error: ${errorMessage}`, "error");

          await saveCompletion({
            id: completionId,
            timestamp: t0,
            inputText: selected_text,
            outputText: "",
            finalText: null,
            wasApplied: 0,
            isReviewMode: reviewMode ? 1 : 0,
            hadError: 1,
            errorMessage,
            inputTokens: null,
            outputTokens: null,
            completionMs: durationMs,
            appId: app,
            promptId: prompt.id,
            promptName: prompt.name,
            promptText: prompt.text,
            model,
            provider,
          }).catch(() => {
            // best-effort — don't surface DB errors on top of LLM errors
          });
        }
      },
    );

    const unlistenOutcome = listen<ReviewOutcomePayload>(
      "raypaste://review-outcome",
      async (event) => {
        const { completionId, finalText, wasApplied } = event.payload;
        await updateCompletionOutcome(
          completionId,
          finalText,
          wasApplied,
        ).catch(() => {});
      },
    );

    return () => {
      unlistenHotkey.then((fn) => fn());
      unlistenOutcome.then((fn) => fn());
    };
  }, []);
}

// Re-export for ReviewPage
export { emit };
