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
  const hasFinal =
    !!row?.isReviewMode &&
    row.finalText !== null &&
    row.finalText !== row.outputText;
  const promptSourceLabel =
    row?.promptSource === "website"
      ? "Website prompt"
      : row?.promptSource === "app"
        ? "App prompt"
        : row?.promptSource === "default"
          ? "Default prompt"
          : row?.promptSource === "builtin"
            ? "Built-in prompt"
            : null;

  return (
    <Dialog open={row !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-card text-card-foreground ring-border flex max-h-[90vh] w-full max-w-4xl flex-col ring-1 sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-foreground text-sm font-semibold">
            Details
          </DialogTitle>
        </DialogHeader>
        {row && (
          <div className="flex min-h-0 flex-1 flex-col gap-4 text-xs">
            <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px]">
              <span>{appName(row.appId)}</span>
              <span>·</span>
              <span>{row.promptName}</span>
              {promptSourceLabel && (
                <>
                  <span>·</span>
                  <span>{promptSourceLabel}</span>
                </>
              )}
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

            {(row.pageUrl || row.matchedWebsitePattern) && (
              <div className="border-border bg-muted/20 rounded-lg border px-3 py-2 text-[11px]">
                {row.matchedWebsitePattern && (
                  <p className="text-foreground">
                    Matched website prompt:{" "}
                    <span className="font-mono">
                      {row.matchedWebsitePattern}
                    </span>
                  </p>
                )}
                {row.pageUrl && (
                  <p className="text-muted-foreground mt-1 break-all">
                    Page: {row.pageUrl}
                  </p>
                )}
              </div>
            )}

            <div className="grid min-h-0 flex-1 grid-cols-2 gap-3 overflow-hidden">
              <div className="flex flex-col overflow-hidden">
                <p className="text-muted-foreground/60 mb-1.5 shrink-0 text-[10px] font-semibold tracking-widest uppercase">
                  Input
                </p>
                <p className="text-foreground/80 min-h-0 flex-1 overflow-y-auto leading-relaxed whitespace-pre-wrap">
                  {row.inputText}
                </p>
              </div>

              {row.hadError ? (
                <div className="flex flex-col overflow-hidden">
                  <p className="mb-1.5 shrink-0 text-[10px] font-semibold tracking-widest text-red-600 uppercase">
                    Error
                  </p>
                  <p className="min-h-0 flex-1 overflow-y-auto text-red-400">
                    {row.errorMessage}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col overflow-hidden">
                  <p className="text-muted-foreground/60 mb-1.5 shrink-0 text-[10px] font-semibold tracking-widest uppercase">
                    {hasFinal ? "Output (original)" : "Output"}
                  </p>
                  <p className="text-foreground/80 min-h-0 flex-1 overflow-y-auto leading-relaxed whitespace-pre-wrap">
                    {row.outputText || (
                      <span className="text-muted-foreground/60 italic">
                        empty
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>

            {hasFinal && (
              <div className="flex shrink-0 flex-col overflow-hidden">
                <p className="text-muted-foreground/60 mb-1.5 shrink-0 text-[10px] font-semibold tracking-widest uppercase">
                  Final (edited)
                </p>
                <p className="text-foreground/80 max-h-72 min-h-48 overflow-y-auto leading-relaxed whitespace-pre-wrap">
                  {row.finalText}
                </p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
