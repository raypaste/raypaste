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
      <DialogContent className="bg-card text-card-foreground ring-border max-w-lg ring-1">
        <DialogHeader>
          <DialogTitle className="text-foreground text-sm font-semibold">
            Details
          </DialogTitle>
        </DialogHeader>
        {row && (
          <div className="flex flex-col gap-4 text-xs">
            <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px]">
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
                <span className="flex items-center gap-0.5 text-violet-500">
                  Review
                </span>
              ) : (
                <span className="text-sky-500">Instant</span>
              )}
              <span>·</span>
              <span className="capitalize">{row.provider}</span>
              <span>·</span>
              <span className="font-mono">{row.model}</span>
            </div>

            <div>
              <p className="text-muted-foreground/60 mb-1.5 text-[10px] font-semibold tracking-widest uppercase">
                Input
              </p>
              <p className="text-foreground/80 leading-relaxed whitespace-pre-wrap">
                {row.inputText}
              </p>
            </div>

            {!row.hadError && (
              <div>
                <p className="text-muted-foreground/60 mb-1.5 text-[10px] font-semibold tracking-widest uppercase">
                  Output
                </p>
                <p className="text-foreground/80 leading-relaxed whitespace-pre-wrap">
                  {row.outputText || (
                    <span className="text-muted-foreground/60 italic">
                      empty
                    </span>
                  )}
                </p>
              </div>
            )}

            {!!row.isReviewMode &&
              row.finalText !== null &&
              row.finalText !== row.outputText && (
                <div>
                  <p className="text-muted-foreground/60 mb-1.5 text-[10px] font-semibold tracking-widest uppercase">
                    Final (edited)
                  </p>
                  <p className="text-foreground/80 leading-relaxed whitespace-pre-wrap">
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
