import { invoke } from "@tauri-apps/api/core";
import { emit } from "@tauri-apps/api/event";
import { getLLMClient } from "#/services/llm";
import {
  INSTANT_PROGRESS_STORAGE_KEY,
  showProgressOverlay,
  showToastOverlay,
} from "#/services/overlayWindows";
import { saveCompletion } from "#/services/db";
import { ModeParams, isAbortError } from "./types";

// Instant mode is used when the user wants to apply the completion to the target app immediately.
export async function runInstantMode(p: ModeParams) {
  // Re-activate the target app before showing overlay — creating a WebviewWindow
  // briefly brings the Raypaste application to the foreground on macOS.
  await invoke("activate_app", { targetPid: p.target_pid }).catch(() => {});

  localStorage.setItem(
    INSTANT_PROGRESS_STORAGE_KEY,
    JSON.stringify({ loading: true }),
  );
  const progressWin = showProgressOverlay();

  let accumulatedText = "";
  const finishProgressOverlay = async () => {
    localStorage.setItem(
      INSTANT_PROGRESS_STORAGE_KEY,
      JSON.stringify({ loading: false }),
    );
    if (progressWin) {
      progressWin.close().catch(() => {});
    }
    await emit("raypaste://instant-done");
  };

  try {
    await getLLMClient().stream(
      {
        messages: [
          { role: "system", content: p.prompt.text },
          { role: "user", content: p.selected_text },
        ],
        model: p.model,
      },
      p.apiKey,
      (chunk) => {
        accumulatedText += chunk;
      },
      p.signal,
    );

    const durationMs = Date.now() - p.t0;

    await invoke("write_text_back", {
      text: accumulatedText,
      targetPid: p.target_pid,
    });

    await saveCompletion({
      id: p.completionId,
      timestamp: p.t0,
      inputText: p.selected_text,
      outputText: accumulatedText,
      finalText: null,
      wasApplied: 1,
      isReviewMode: 0,
      hadError: 0,
      errorMessage: null,
      inputTokens: null,
      outputTokens: null,
      completionMs: durationMs,
      appId: p.app,
      promptId: p.prompt.id,
      promptName: p.prompt.name,
      promptText: p.prompt.text,
      model: p.model,
      provider: p.provider,
    });
    await emit("raypaste://completion-saved");
    // Re-activate the target app before closing the overlay — when the overlay
    // window closes, macOS would otherwise focus the Raypaste main window.
    await invoke("activate_app", { targetPid: p.target_pid }).catch(() => {});
    await finishProgressOverlay();
  } catch (err) {
    if (isAbortError(err)) {
      await finishProgressOverlay();
      return;
    }

    const errorMessage = err instanceof Error ? err.message : String(err);
    await finishProgressOverlay();
    showToastOverlay(`Error: ${errorMessage}`, "error");

    await saveCompletion({
      id: p.completionId,
      timestamp: p.t0,
      inputText: p.selected_text,
      outputText: "",
      finalText: null,
      wasApplied: 0,
      isReviewMode: 0,
      hadError: 1,
      errorMessage,
      inputTokens: null,
      outputTokens: null,
      completionMs: Date.now() - p.t0,
      appId: p.app,
      promptId: p.prompt.id,
      promptName: p.prompt.name,
      promptText: p.prompt.text,
      model: p.model,
      provider: p.provider,
    }).catch(() => {});
  }
}
