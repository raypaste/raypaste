import { useToasts, removeToast } from "#/hooks/useToast";
import { Toast } from "./Toast";

export function ToastContainer() {
  const toasts = useToasts();
  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-50 flex w-80 flex-col gap-2">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <Toast toast={t} onDismiss={removeToast} />
        </div>
      ))}
    </div>
  );
}
