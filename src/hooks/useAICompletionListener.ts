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
  page_url?: string | null;
}

interface ReviewOutcomePayload {
  completionId: string;
  finalText: string | null;
  wasApplied: boolean;
  targetPid: number;
}

const BROWSER_APP_IDS = new Set([
  "com.apple.Safari",
  "company.thebrowser.Browser",
  "com.google.Chrome",
  "com.google.Chrome.canary",
  "com.brave.Browser",
  "com.microsoft.edgemac",
  "com.operasoftware.Opera",
  "org.mozilla.firefox",
  "org.mozilla.firefoxdeveloperedition",
]);

export function useAICompletionListener() {
  const abortControllerRef = useRef<AbortController | null>(null);
  const websitePromptHintedAppsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const unlistenHotkey = listen<HotkeyPayload>(
      "raypaste://hotkey-triggered",
      async (event) => {
        const { app, selected_text, target_pid, page_url } = event.payload;

        if (!selected_text.trim()) {
          showToastOverlay(
            "No text selected. Select some text and try again.",
            "error",
          );
          return;
        }

        const promptsState = usePromptsStore.getState();
        const resolution = promptsState.resolvePromptForHotkey(app, page_url);

        if (!resolution) {
          showToastOverlay(
            "No prompt configured. Create one in New Prompt.",
            "error",
          );
          return;
        }

        if (
          promptsState.websitePromptSites.length > 0 &&
          !page_url &&
          BROWSER_APP_IDS.has(app) &&
          !websitePromptHintedAppsRef.current.has(app)
        ) {
          websitePromptHintedAppsRef.current.add(app);
          showToastOverlay(
            "Website prompts were unavailable for this tab, so Raypaste used your usual fallback prompt.",
            "info",
            4200,
          );
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
            prompt: resolution.prompt,
            promptSource: resolution.source,
            pageUrl: resolution.pageUrl,
            matchedWebsitePattern: resolution.matchedWebsitePattern,
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
            prompt: resolution.prompt,
            promptSource: resolution.source,
            pageUrl: resolution.pageUrl,
            matchedWebsitePattern: resolution.matchedWebsitePattern,
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
    const unlistenInstantCancel = listen<{ targetPid: number }>(
      "raypaste://instant-cancel",
      async (event) => {
        abortControllerRef.current?.abort();
        abortControllerRef.current = null;
        // Match review-mode cancellation behavior by returning focus to the
        // original target app after the instant-mode overlay is dismissed.
        await invoke("activate_app", {
          targetPid: event.payload.targetPid,
        }).catch(() => {});
      },
    );

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
