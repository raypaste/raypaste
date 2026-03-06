import { useSyncExternalStore } from "react";

export type ToastVariant = "error" | "success" | "info";

export interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
}

type Listener = () => void;

let toasts: Toast[] = [];
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((l) => l());
}

export function removeToast(id: string) {
  toasts = toasts.filter((t) => t.id !== id);
  notify();
}

function addToast(message: string, variant: ToastVariant) {
  const id = crypto.randomUUID();
  toasts = [...toasts, { id, message, variant }];
  notify();
  setTimeout(() => removeToast(id), 4000);
}

export const toast = {
  error: (msg: string) => addToast(msg, "error"),
  success: (msg: string) => addToast(msg, "success"),
  info: (msg: string) => addToast(msg, "info"),
};

export function useToasts(): Toast[] {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => toasts,
  );
}
