import { X } from "lucide-react";
import { cn } from "#/lib/utils";
import type { Toast as ToastType } from "#/hooks/useToast";

const variantStyles: Record<ToastType["variant"], string> = {
  error: "border-red-500/30 bg-red-950/80 text-red-200",
  success: "border-green-500/30 bg-green-950/80 text-green-200",
  info: "border-white/10 bg-neutral-900/90 text-neutral-200",
};

interface ToastProps {
  toast: ToastType;
  onDismiss: (id: string) => void;
}

export function Toast({ toast, onDismiss }: ToastProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border px-4 py-3 shadow-xl backdrop-blur-sm",
        variantStyles[toast.variant],
      )}
    >
      <span className="flex-1 text-sm">{toast.message}</span>
      <button
        onClick={() => onDismiss(toast.id)}
        className="mt-0.5 cursor-pointer opacity-60 transition-opacity hover:opacity-100"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
