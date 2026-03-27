import {
  WebviewWindow,
  getCurrentWebviewWindow,
} from "@tauri-apps/api/webviewWindow";
import { toast } from "#/hooks/useToast";
import { OVERLAY } from "#/lib/overlay";

export type NotificationVariant = "error" | "success" | "info";

/**
 * Shows an app toast (Sonner) in the main window. Hotkey flows run in the main
 * webview; separate notification WebviewWindows bypassed the mounted Toaster,
 * so errors often never appeared after switching to Sonner.
 */
export function showToastOverlay(
  message: string,
  variant: NotificationVariant,
  durationMs = 3000,
): void {
  const opts = { duration: durationMs };
  switch (variant) {
    case "error":
      toast.error(message, opts);
      break;
    case "success":
      toast.success(message, opts);
      break;
    case "info":
      toast.info(message, opts);
      break;
  }

  if (variant === "error") {
    void getCurrentWebviewWindow()
      .setFocus()
      .catch(() => {});
  }
}

// Stored in localStorage while a review is pending or streaming
export type PendingReviewStorage =
  | {
      loading: true;
      originalText: string;
      targetPid: number;
      streamedText: string;
    }
  | {
      loading: false;
      completionId: string;
      completedText: string;
      originalText: string;
      targetPid: number;
      durationMs: number;
    };

export const REVIEW_STORAGE_KEY = "raypaste-pending-review";
export const INSTANT_PROGRESS_STORAGE_KEY = "raypaste-pending-instant";

export interface PendingInstantProgressStorage {
  loading: boolean;
  targetPid: number;
}

/**
 * Open the review overlay window. The caller must write initial state to
 * localStorage under REVIEW_STORAGE_KEY before calling this.
 */
export function showReviewOverlay(): WebviewWindow | null {
  const width = 600;
  const height = 700;
  const x = Math.round((window.screen.availWidth - width) / 2);
  const y = Math.round((window.screen.availHeight - height) / 2);

  try {
    return new WebviewWindow(`review-${Date.now()}`, {
      url: `/?overlay=${OVERLAY.review}`,
      width,
      height,
      transparent: true,
      decorations: false,
      shadow: false,
      alwaysOnTop: true,
      skipTaskbar: true,
      focus: true,
      x,
      y,
    });
  } catch {
    return null;
  }
}

/** Open the small progress spinner overlay for instant-mode LLM requests. */
export function showProgressOverlay(): WebviewWindow | null {
  const width = 280;
  const height = 50;
  const x = Math.round((window.screen.availWidth - width) / 2);
  const y = Math.round((window.screen.availHeight - height) / 2);

  try {
    return new WebviewWindow(`progress-${Date.now()}`, {
      url: `/?overlay=${OVERLAY.progress}`,
      width,
      height,
      transparent: true,
      decorations: false,
      shadow: false,
      alwaysOnTop: true,
      skipTaskbar: true,
      // Match review overlay: without focus, macOS can activate Raypaste but
      // leave keyboard focus on the main window instead of this overlay.
      focus: true,
      x,
      y,
    });
  } catch {
    return null;
  }
}
