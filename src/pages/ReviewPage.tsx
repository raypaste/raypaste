import { useEffect, useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { cn } from "#/lib/utils";
import {
  REVIEW_STORAGE_KEY,
  type PendingReview,
} from "#/services/overlayWindows";

function loadPendingReview() {
  const raw = localStorage.getItem(REVIEW_STORAGE_KEY);
  if (!raw) return { data: null, text: "" };

  try {
    const data = JSON.parse(raw) as PendingReview;
    return { data, text: data.completedText };
  } catch {
    return { data: null, text: "" };
  }
}

function getShortcutLabel() {
  const platform = navigator.userAgent.toLowerCase();
  const isMac = platform.includes("mac");

  return {
    apply: isMac ? "Cmd + Enter" : "Ctrl + Enter",
    applyAlt: isMac ? "Ctrl + Enter also works" : "Cmd + Enter also works",
  };
}

export function ReviewPage() {
  const [{ data, text: initialText }] = useState(loadPendingReview);
  const [text, setText] = useState(initialText);
  const [applied, setApplied] = useState(false);
  const win = getCurrentWebviewWindow();
  const shortcuts = getShortcutLabel();

  useEffect(() => {
    if (!data) {
      win.close();
    }
  }, [data, win]);

  const handleApply = useCallback(async () => {
    if (!data || applied) return;
    setApplied(true);
    try {
      await invoke("write_text_back", { text, targetPid: data.targetPid });
      localStorage.removeItem(REVIEW_STORAGE_KEY);
      await win.close();
    } catch (error) {
      setApplied(false);
      console.error("Failed to apply review text", error);
    }
  }, [data, text, applied, win]);

  const handleDismiss = useCallback(async () => {
    localStorage.removeItem(REVIEW_STORAGE_KEY);
    await win.close();
  }, [win]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleDismiss();
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleApply();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleApply, handleDismiss]);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const durationSec = data ? (data.durationMs / 1000).toFixed(1) : "0.0";

  return (
    <div
      className="flex h-screen w-screen flex-col overflow-hidden rounded-[20px] bg-neutral-950/96"
      style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
    >
      {/* Title bar / drag region */}
      <div
        className="flex shrink-0 items-center justify-between border-b border-white/8 px-6 py-4"
        style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
      >
        <span className="text-xs font-semibold tracking-[0.02em] text-neutral-200">
          Review Completion
        </span>
        <div
          className="flex items-center gap-2 text-[11px] text-neutral-500"
          style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
        >
          <span>{wordCount} words</span>
          <span className="text-neutral-700">·</span>
          <span>{durationSec}s</span>
        </div>
      </div>

      {/* Original text */}
      {data && (
        <div className="shrink-0 border-b border-white/6 px-6 py-4">
          <p className="mb-2 text-[10px] font-semibold tracking-[0.18em] text-neutral-500 uppercase">
            Original
          </p>
          <p className="line-clamp-2 text-sm leading-relaxed text-neutral-400">
            {data.originalText}
          </p>
        </div>
      )}

      {/* Completion editor */}
      <div className="flex flex-1 flex-col overflow-hidden bg-neutral-950/96 px-6 py-5">
        <p className="mb-2 shrink-0 text-[10px] font-semibold tracking-[0.18em] text-neutral-400 uppercase">
          Completion
        </p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          autoFocus
          className={cn(
            "flex-1 resize-none bg-transparent text-[15px] leading-[1.75] text-neutral-50",
            "placeholder:text-neutral-600 focus:outline-none",
          )}
        />
      </div>

      {/* Footer actions */}
      <div className="flex shrink-0 items-center justify-between border-t border-white/8 bg-black/45 px-6 py-4 backdrop-blur-xl">
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
        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-neutral-500 sm:block">
            {shortcuts.applyAlt}
          </span>
          <button
            type="button"
            onClick={handleApply}
            className="inline-flex items-center gap-2 rounded-xl bg-neutral-100 px-4 py-2 text-sm font-semibold text-neutral-950 transition-colors hover:bg-white"
          >
            <span>Apply</span>
            <kbd className="rounded-md border border-black/15 bg-black/10 px-2 py-0.5 font-mono text-[11px] text-neutral-900">
              {shortcuts.apply}
            </kbd>
          </button>
        </div>
      </div>
    </div>
  );
}
