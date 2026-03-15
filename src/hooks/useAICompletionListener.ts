import { useEffect, useRef } from "react";
import { listen } from "@tauri-apps/api/event";
import { emit } from "@tauri-apps/api/event";
import { usePromptsStore, useSettingsStore } from "#/stores";
import { getApiKey } from "#/services/llm";
import { showToastOverlay } from "#/services/overlayWindows";
import { updateCompletionOutcome } from "#/services/db";
import { runReviewMode } from "#/lib/core/reviewMode";
import { runInstantMode } from "#/lib/core/instantMode";
import { invoke } from "@tauri-apps/api/core";

interface HotkeyPayload {
  app: string;
  selected_text: string;
  target_pid: number;
}

interface ReviewOutcomePayload {
  completionId: string;
  finalText: string | null;
  wasApplied: boolean;
  targetPid: number;
}

export function useAICompletionListener() {
  const abortControllerRef = useRef<AbortController | null>(null);

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

        // Abort any in-flight request and signal its overlay to close
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
          await emit("raypaste://abort-overlay");
        }

        const controller = new AbortController();
        abortControllerRef.current = controller;
        const { signal } = controller;

        await useSettingsStore.persist.rehydrate();
        const { model, provider, reviewMode } = useSettingsStore.getState();

        const completionId = crypto.randomUUID();
        const t0 = Date.now();

        if (reviewMode) {
          await runReviewMode({
            signal,
            selected_text,
            target_pid,
            app,
            prompt,
            model,
            provider,
            completionId,
            t0,
            apiKey,
          });
        } else {
          await runInstantMode({
            signal,
            selected_text,
            target_pid,
            app,
            prompt,
            model,
            provider,
            completionId,
            t0,
            apiKey,
          });
        }

        // Only clear the ref if this controller is still the current one
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
        }
      },
    );

    const unlistenOutcome = listen<ReviewOutcomePayload>(
      "raypaste://review-outcome",
      async (event) => {
        const { completionId, finalText, wasApplied, targetPid } =
          event.payload;
        await updateCompletionOutcome(
          completionId,
          finalText,
          wasApplied,
        ).catch(() => {});
        // Restore focus to target app
        await invoke("activate_app", { targetPid }).catch(() => {});
      },
    );

    // User cancelled from review overlay during streaming
    const unlistenStreamCancel = listen<{ targetPid: number }>(
      "raypaste://stream-cancel",
      async (event) => {
        abortControllerRef.current?.abort();
        abortControllerRef.current = null;
        // Restore focus to target app
        await invoke("activate_app", {
          targetPid: event.payload.targetPid,
        }).catch(() => {});
      },
    );

    // User cancelled from progress overlay during instant mode
    const unlistenInstantCancel = listen("raypaste://instant-cancel", () => {
      abortControllerRef.current?.abort();
      abortControllerRef.current = null;
    });

    return () => {
      unlistenHotkey.then((fn) => fn());
      unlistenOutcome.then((fn) => fn());
      unlistenStreamCancel.then((fn) => fn());
      unlistenInstantCancel.then((fn) => fn());
    };
  }, []);
}

// Re-export for ReviewPage
export { emit };
