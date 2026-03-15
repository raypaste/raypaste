import { useEffect, useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { emit, listen } from "@tauri-apps/api/event";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { cn } from "#/lib/utils";
import {
  REVIEW_STORAGE_KEY,
  type PendingReviewStorage,
} from "#/services/overlayWindows";

function loadStorage(): PendingReviewStorage | null {
  const raw = localStorage.getItem(REVIEW_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PendingReviewStorage;
  } catch {
    return null;
  }
}

function getShortcutLabel() {
  const isMac = navigator.userAgent.toLowerCase().includes("mac");
  return {
    apply: isMac ? "Cmd + Enter" : "Ctrl + Enter",
    applyAlt: isMac ? "Ctrl + Enter also works" : "Cmd + Enter also works",
  };
}

type Phase =
  | { kind: "loading" }
  | {
      kind: "ready";
      completionId: string;
      targetPid: number;
      durationMs: number;
      originalText: string;
    }
  | { kind: "error"; message: string };

export function ReviewPage() {
  const initial = loadStorage();
  const win = getCurrentWebviewWindow();
  const shortcuts = getShortcutLabel();

  const [text, setText] = useState(
    initial?.loading === true
      ? initial.streamedText
      : initial?.loading === false
        ? initial.completedText
        : "",
  );
  const [originalText] = useState(initial ? initial.originalText : "");
  const [phase, setPhase] = useState<Phase>(() => {
    if (!initial) return { kind: "error", message: "No pending review found." };
    if (initial.loading === false) {
      return {
        kind: "ready",
        completionId: initial.completionId,
        targetPid: initial.targetPid,
        durationMs: initial.durationMs,
        originalText: initial.originalText,
      };
    }
    return { kind: "loading" };
  });
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    if (!initial) {
      win.close();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Subscribe to streaming events
  useEffect(() => {
    const unlistenChunk = listen<{ text: string }>(
      "raypaste://stream-chunk",
      (e) => {
        setText(e.payload.text);
      },
    );

    const unlistenDone = listen("raypaste://stream-done", () => {
      const stored = loadStorage();
      if (!stored || stored.loading !== false) return;
      setPhase({
        kind: "ready",
        completionId: stored.completionId,
        targetPid: stored.targetPid,
        durationMs: stored.durationMs,
        originalText: stored.originalText,
      });
    });

    const unlistenError = listen<{ message: string }>(
      "raypaste://stream-error",
      (e) => {
        setPhase({ kind: "error", message: e.payload.message });
        setTimeout(() => win.close(), 2500);
      },
    );

    const unlistenAbort = listen("raypaste://abort-overlay", () => {
      localStorage.removeItem(REVIEW_STORAGE_KEY);
      win.close();
    });

    return () => {
      unlistenChunk.then((fn) => fn());
      unlistenDone.then((fn) => fn());
      unlistenError.then((fn) => fn());
      unlistenAbort.then((fn) => fn());
    };
  }, [win]);

  const handleApply = useCallback(async () => {
    if (phase.kind !== "ready" || applied) return;
    setApplied(true);
    try {
      await invoke("write_text_back", { text, targetPid: phase.targetPid });
      localStorage.removeItem(REVIEW_STORAGE_KEY);
      await emit("raypaste://review-outcome", {
        completionId: phase.completionId,
        finalText: text,
        wasApplied: true,
      });
      await win.close();
    } catch {
      setApplied(false);
    }
  }, [phase, text, applied, win]);

  const handleDismiss = useCallback(async () => {
    localStorage.removeItem(REVIEW_STORAGE_KEY);
    if (phase.kind === "ready") {
      await emit("raypaste://review-outcome", {
        completionId: phase.completionId,
        finalText: null,
        wasApplied: false,
      });
    }
    await win.close();
  }, [phase, win]);

  const handleCancel = useCallback(async () => {
    localStorage.removeItem(REVIEW_STORAGE_KEY);
    await emit("raypaste://stream-cancel");
    await win.close();
  }, [win]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (phase.kind === "loading") {
          handleCancel();
        } else {
          handleDismiss();
        }
      }
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleApply();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, handleApply, handleDismiss, handleCancel]);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const isLoading = phase.kind === "loading";
  const isError = phase.kind === "error";
  const durationSec =
    phase.kind === "ready" ? (phase.durationMs / 1000).toFixed(1) : null;

  return (
    <div
      className="flex h-screen w-screen flex-col overflow-hidden rounded-[20px] bg-neutral-950/96"
      style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
    >
      {/* Title bar */}
      <div
        className="flex shrink-0 items-center justify-between border-b border-white/8 px-6 py-4"
        style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
      >
        <div className="flex items-center gap-2">
          {isLoading && (
            <svg
              className="size-3.5 shrink-0 animate-spin text-neutral-400"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          )}
          <span className="text-xs font-semibold tracking-[0.02em] text-neutral-200">
            {isLoading
              ? "Generating…"
              : isError
                ? "Error"
                : "Review Completion"}
          </span>
        </div>
        <div
          className="flex items-center gap-2 text-[11px] text-neutral-500"
          style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
        >
          {!isLoading && wordCount > 0 && (
            <>
              <span>{wordCount} words</span>
              {durationSec && (
                <>
                  <span className="text-neutral-700">·</span>
                  <span>{durationSec}s</span>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Original text */}
      {originalText && (
        <div className="shrink-0 border-b border-white/6 px-6 py-4">
          <p className="mb-2 text-[10px] font-semibold tracking-[0.18em] text-neutral-500 uppercase">
            Original
          </p>
          <p className="line-clamp-2 text-sm leading-relaxed text-neutral-400">
            {originalText}
          </p>
        </div>
      )}

      {/* Completion editor / error */}
      <div className="flex flex-1 flex-col overflow-hidden bg-neutral-950/96 px-6 py-5">
        {isError ? (
          <p className="text-sm leading-relaxed text-red-400">
            {phase.message}
          </p>
        ) : (
          <>
            <p className="mb-2 shrink-0 text-[10px] font-semibold tracking-[0.18em] text-neutral-400 uppercase">
              Completion
            </p>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              readOnly={isLoading}
              autoFocus={!isLoading}
              className={cn(
                "flex-1 resize-none bg-transparent text-[15px] leading-[1.75] text-neutral-50",
                "placeholder:text-neutral-600 focus:outline-none",
                isLoading && "cursor-default text-neutral-300",
              )}
              placeholder={isLoading ? "" : undefined}
            />
          </>
        )}
      </div>

      {/* Footer */}
      <div className="flex shrink-0 items-center justify-between border-t border-white/8 bg-black/45 px-6 py-4 backdrop-blur-xl">
        {isLoading ? (
          <button
            type="button"
            onClick={handleCancel}
            className="inline-flex items-center gap-2 rounded-lg border border-white/12 bg-white/5 px-3 py-2 text-sm font-medium text-neutral-200 transition-colors hover:border-white/18 hover:bg-white/8"
          >
            <span>Cancel</span>
            <kbd className="rounded-md border border-white/20 bg-black/20 px-2 py-0.5 font-mono text-[11px] text-neutral-100">
              Esc
            </kbd>
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={handleDismiss}
              className="inline-flex items-center gap-2 rounded-lg border border-white/12 bg-white/5 px-3 py-2 text-sm font-medium text-neutral-200 transition-colors hover:border-white/18 hover:bg-white/8"
            >
              <span>Dismiss</span>
              <kbd className="rounded-md border border-white/20 bg-black/20 px-2 py-0.5 font-mono text-[11px] text-neutral-100">
                Esc
              </kbd>
            </button>
            {!isError && (
              <div className="flex items-center gap-3">
                <span className="hidden text-xs text-neutral-500 sm:block">
                  {shortcuts.applyAlt}
                </span>
                <button
                  type="button"
                  onClick={handleApply}
                  disabled={applied}
                  className="inline-flex items-center gap-2 rounded-xl bg-neutral-100 px-4 py-2 text-sm font-semibold text-neutral-950 transition-colors hover:bg-white disabled:opacity-50"
                >
                  <span>Apply</span>
                  <kbd className="rounded-md border border-black/15 bg-black/10 px-2 py-0.5 font-mono text-[11px] text-neutral-900">
                    {shortcuts.apply}
                  </kbd>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
