import { invoke } from "@tauri-apps/api/core";
import { emit } from "@tauri-apps/api/event";
import { getLLMClient } from "#/services/llm";
import {
  showProgressOverlay,
  showToastOverlay,
} from "#/services/overlayWindows";
import { saveCompletion } from "#/services/db";
import { ModeParams, isAbortError } from "./types";

// Instant mode is used when the user wants to apply the completion to the target app immediately.
export async function runInstantMode(p: ModeParams) {
  const progressWin = showProgressOverlay();
  // Re-activate the target app immediately — creating a WebviewWindow briefly
  // brings the Raypaste application to the foreground on macOS.
  invoke("activate_app", { targetPid: p.target_pid }).catch(() => {});

  let accumulatedText = "";

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
  } catch (err) {
    if (isAbortError(err)) {
      progressWin?.close();
      return;
    }

    const errorMessage = err instanceof Error ? err.message : String(err);
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

  // Close the progress overlay from the main window — no cross-window
  // event needed. This is reliable regardless of whether the overlay
  // window has finished loading its JS bundle.
  progressWin?.close();
}
