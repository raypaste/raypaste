import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { toast } from "#/hooks/useToast";
import { OVERLAY } from "#/lib/overlay";

const TOAST_WIDTH = 300;
const TOAST_HEIGHT = 46;
const MARGIN = 16;
const GAP = 6;

let activeToastCount = 0;

function getToastPosition(index: number) {
  const x = Math.round(window.screen.availWidth - TOAST_WIDTH - MARGIN);
  const y = Math.round(
    window.screen.availHeight - (TOAST_HEIGHT + GAP) * (index + 1) - MARGIN,
  );
  return { x, y };
}

export type NotificationVariant = "error" | "success" | "info";

export function showToastOverlay(
  message: string,
  variant: NotificationVariant,
  durationMs = 3000,
): WebviewWindow | null {
  const index = activeToastCount++;
  const { x, y } = getToastPosition(index);
  const params = new URLSearchParams({
    overlay: OVERLAY.toast,
    message,
    variant,
    duration: String(durationMs),
  });

  try {
    const win = new WebviewWindow(`notification-${Date.now()}`, {
      url: `/?${params}`,
      width: TOAST_WIDTH,
      height: TOAST_HEIGHT,
      transparent: true,
      decorations: false,
      alwaysOnTop: true,
      skipTaskbar: true,
      focus: false,
      x,
      y,
    });
    win.once("tauri://destroyed", () => {
      activeToastCount = Math.max(0, activeToastCount - 1);
    });
    return win;
  } catch {
    activeToastCount = Math.max(0, activeToastCount - 1);
    toast[variant](message);
    return null;
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
      focus: false,
      x,
      y,
    });
  } catch {
    return null;
  }
}
