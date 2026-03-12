import type { CompletionEntry } from "#/services/db";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "#/components/ui/dialog";
import { timeAgo } from "./helpers";

interface DetailDialogProps {
  row: CompletionEntry | null;
  onClose: () => void;
  appName: (id: string) => string;
}

export function DetailDialog({ row, onClose, appName }: DetailDialogProps) {
  return (
    <Dialog open={row !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg bg-neutral-900 text-neutral-100 ring-1 ring-white/10">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold text-neutral-200">
            Details
          </DialogTitle>
        </DialogHeader>
        {row && (
          <div className="flex flex-col gap-4 text-xs">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-neutral-500">
              <span>{appName(row.appId)}</span>
              <span>·</span>
              <span>{row.promptName}</span>
              <span>·</span>
              <span>{timeAgo(row.timestamp)}</span>
              {row.completionMs > 0 && (
                <>
                  <span>·</span>
                  <span>{(row.completionMs / 1000).toFixed(2)}s</span>
                </>
              )}
              <span>·</span>
              {row.isReviewMode ? (
                <span className="flex items-center gap-0.5 text-violet-400">
                  Review
                </span>
              ) : (
                <span className="text-sky-400">Instant</span>
              )}
              <span>·</span>
              <span className="capitalize">{row.provider}</span>
              <span>·</span>
              <span className="font-mono">{row.model}</span>
            </div>

            <div>
              <p className="mb-1.5 text-[10px] font-semibold tracking-widest text-neutral-600 uppercase">
                Input
              </p>
              <p className="leading-relaxed whitespace-pre-wrap text-neutral-300">
                {row.inputText}
              </p>
            </div>

            {!row.hadError && (
              <div>
                <p className="mb-1.5 text-[10px] font-semibold tracking-widest text-neutral-600 uppercase">
                  Output
                </p>
                <p className="leading-relaxed whitespace-pre-wrap text-neutral-300">
                  {row.outputText || (
                    <span className="text-neutral-600 italic">empty</span>
                  )}
                </p>
              </div>
            )}

            {!!row.isReviewMode &&
              row.finalText !== null &&
              row.finalText !== row.outputText && (
                <div>
                  <p className="mb-1.5 text-[10px] font-semibold tracking-widest text-neutral-600 uppercase">
                    Final (edited)
                  </p>
                  <p className="leading-relaxed whitespace-pre-wrap text-neutral-300">
                    {row.finalText}
                  </p>
                </div>
              )}

            {!!row.hadError && row.errorMessage && (
              <div>
                <p className="mb-1.5 text-[10px] font-semibold tracking-widest text-red-600 uppercase">
                  Error
                </p>
                <p className="text-red-400">{row.errorMessage}</p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
