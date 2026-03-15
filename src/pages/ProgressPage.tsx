import { useEffect } from "react";
import { emit } from "@tauri-apps/api/event";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";

export function ProgressPage() {
  const win = getCurrentWebviewWindow();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        emit("raypaste://instant-cancel").catch(() => {});
        win.close();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [win]);

  return (
    <div className="flex h-screen items-center gap-3 rounded-2xl border border-white/10 bg-neutral-950/92 px-4 text-neutral-200 shadow-2xl backdrop-blur-md">
      <svg
        className="size-4 shrink-0 animate-spin text-neutral-400"
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
      <span className="flex-1 text-sm font-medium">Processing…</span>
      <span className="text-xs text-neutral-500">Esc to cancel</span>
    </div>
  );
}
