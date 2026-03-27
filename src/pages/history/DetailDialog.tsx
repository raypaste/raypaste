import { useCallback, useMemo, useState, type ReactNode } from "react";
import { Copy, Eye, EyeOff } from "lucide-react";
import type { CompletionEntry } from "#/services/db";
import { Button } from "#/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "#/components/ui/dialog";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "#/components/ui/resizable";
import { toast } from "#/hooks/useToast";
import { cn } from "#/lib/utils";
import { timeAgo } from "./helpers";

interface DetailDialogProps {
  row: CompletionEntry | null;
  onClose: () => void;
  appName: (id: string) => string;
}

type ColumnKey = "input" | "output" | "final";

async function copyToClipboard(text: string, label: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`Copied ${label} to clipboard`);
  } catch {
    toast.error("Could not copy");
  }
}

function SectionHeader({
  label,
  labelClassName,
  onCopy,
  visibility,
}: {
  label: string;
  labelClassName?: string;
  onCopy: () => void;
  visibility?: { onToggle: () => void };
}) {
  return (
    <div className="mb-1.5 flex shrink-0 items-center justify-between gap-2">
      <p
        className={cn(
          "text-[10px] font-semibold tracking-widest uppercase",
          labelClassName ?? "text-muted-foreground/60",
        )}
      >
        {label}
      </p>
      <div className="flex shrink-0 items-center gap-0.5">
        {visibility && (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="text-muted-foreground hover:text-foreground"
            onClick={visibility.onToggle}
            aria-label={`Hide ${label}`}
            title="Hide column"
          >
            <Eye className="size-3" />
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className="text-muted-foreground hover:text-foreground"
          onClick={onCopy}
          aria-label={`Copy ${label}`}
          title="Copy to clipboard"
        >
          <Copy className="size-3" />
        </Button>
      </div>
    </div>
  );
}

function countVisible(v: Record<ColumnKey, boolean>) {
  return (["input", "output", "final"] as const).filter((k) => v[k]).length;
}

interface DetailDialogBodyProps {
  row: CompletionEntry;
  appName: (id: string) => string;
}

function DetailDialogBody({ row, appName }: DetailDialogBodyProps) {
  const hasFinal =
    row.isReviewMode &&
    row.finalText !== null &&
    row.finalText !== row.outputText;

  const [columnVisibility, setColumnVisibility] = useState<
    Record<ColumnKey, boolean>
  >({
    input: true,
    output: true,
    final: true,
  });

  const promptSourceLabel =
    row.promptSource === "website"
      ? "Website prompt"
      : row.promptSource === "app"
        ? "App prompt"
        : row.promptSource === "default"
          ? "Default prompt"
          : row.promptSource === "builtin"
            ? "Built-in prompt"
            : null;

  const threeColumnMode = hasFinal && !row.hadError;

  const toggleColumn = useCallback((key: ColumnKey) => {
    setColumnVisibility((prev) => {
      if (prev[key] && countVisible(prev) === 1) {
        toast.info("At least one column must stay visible");
        return prev;
      }
      return { ...prev, [key]: !prev[key] };
    });
  }, []);

  const threeColumnPanels = useMemo(() => {
    if (!row || !threeColumnMode) return null;

    const outputLabel = hasFinal ? "Output (original)" : "Output";

    type PanelDef = {
      key: ColumnKey;
      header: ReactNode;
      body: ReactNode;
    };

    const defs: PanelDef[] = [
      {
        key: "input",
        header: (
          <SectionHeader
            label="Input"
            onCopy={() => copyToClipboard(row.inputText, "input")}
            visibility={{ onToggle: () => toggleColumn("input") }}
          />
        ),
        body: (
          <p className="text-foreground/80 min-h-0 flex-1 overflow-y-auto leading-relaxed whitespace-pre-wrap">
            {row.inputText}
          </p>
        ),
      },
      {
        key: "output",
        header: (
          <SectionHeader
            label={outputLabel}
            onCopy={() => copyToClipboard(row.outputText ?? "", "output")}
            visibility={{ onToggle: () => toggleColumn("output") }}
          />
        ),
        body: (
          <p className="text-foreground/80 min-h-0 flex-1 overflow-y-auto leading-relaxed whitespace-pre-wrap">
            {row.outputText || (
              <span className="text-muted-foreground/60 italic">empty</span>
            )}
          </p>
        ),
      },
      {
        key: "final",
        header: (
          <SectionHeader
            label="Final (edited)"
            onCopy={() => copyToClipboard(row.finalText ?? "", "final")}
            visibility={{ onToggle: () => toggleColumn("final") }}
          />
        ),
        body: (
          <p className="text-foreground/80 min-h-0 flex-1 overflow-y-auto leading-relaxed whitespace-pre-wrap">
            {row.finalText}
          </p>
        ),
      },
    ];

    return defs.filter((d) => columnVisibility[d.key]);
  }, [row, threeColumnMode, hasFinal, columnVisibility, toggleColumn]);

  return (
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
              <span className="font-mono">{row.matchedWebsitePattern}</span>
            </p>
          )}
          {row.pageUrl && (
            <p className="text-muted-foreground mt-1 break-all">
              Page: {row.pageUrl}
            </p>
          )}
        </div>
      )}

      {threeColumnMode &&
        threeColumnPanels &&
        countVisible(columnVisibility) < 3 && (
          <div className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px]">
            <span className="shrink-0 font-medium">Show hidden:</span>
            {!columnVisibility.input && (
              <Button
                type="button"
                variant="outline"
                size="xs"
                className="h-6 gap-1 px-2"
                onClick={() =>
                  setColumnVisibility((p) => ({ ...p, input: true }))
                }
              >
                <EyeOff className="size-3" />
                Input
              </Button>
            )}
            {!columnVisibility.output && (
              <Button
                type="button"
                variant="outline"
                size="xs"
                className="h-6 gap-1 px-2"
                onClick={() =>
                  setColumnVisibility((p) => ({ ...p, output: true }))
                }
              >
                <EyeOff className="size-3" />
                Output (original)
              </Button>
            )}
            {!columnVisibility.final && (
              <Button
                type="button"
                variant="outline"
                size="xs"
                className="h-6 gap-1 px-2"
                onClick={() =>
                  setColumnVisibility((p) => ({ ...p, final: true }))
                }
              >
                <EyeOff className="size-3" />
                Final (edited)
              </Button>
            )}
          </div>
        )}

      <ResizablePanelGroup
        key={`${row.id}-${threeColumnMode ? JSON.stringify(columnVisibility) : "default"}`}
        orientation="horizontal"
        className="min-h-[min(440px,58vh)] w-full min-w-0 flex-1"
      >
        {threeColumnMode && threeColumnPanels ? (
          <>
            {threeColumnPanels.flatMap((panel, i) => {
              const per = 100 / threeColumnPanels.length;
              const nodes: (ReactNode | null)[] = [
                i > 0 ? (
                  <ResizableHandle key={`h-${panel.key}`} withHandle />
                ) : null,
                <ResizablePanel
                  key={panel.key}
                  defaultSize={per}
                  minSize={18}
                  className="min-w-0"
                >
                  <div
                    className={cn(
                      "flex h-full min-h-0 flex-col overflow-hidden",
                      panel.key === "input" && "pr-1",
                      panel.key === "output" && "px-1",
                      panel.key === "final" && "pl-1",
                    )}
                  >
                    {panel.header}
                    {panel.body}
                  </div>
                </ResizablePanel>,
              ];
              return nodes.filter(Boolean);
            })}
          </>
        ) : row.hadError ? (
          <>
            <ResizablePanel defaultSize={50} minSize={18} className="min-w-0">
              <div className="flex h-full min-h-0 flex-col overflow-hidden pr-1">
                <SectionHeader
                  label="Input"
                  onCopy={() => copyToClipboard(row.inputText, "input")}
                />
                <p className="text-foreground/80 min-h-0 flex-1 overflow-y-auto leading-relaxed whitespace-pre-wrap">
                  {row.inputText}
                </p>
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={50} minSize={18} className="min-w-0">
              <div className="flex h-full min-h-0 flex-col overflow-hidden pl-1">
                <SectionHeader
                  label="Error"
                  labelClassName="text-red-600"
                  onCopy={() =>
                    copyToClipboard(row.errorMessage ?? "", "error")
                  }
                />
                <p className="min-h-0 flex-1 overflow-y-auto text-red-400">
                  {row.errorMessage}
                </p>
              </div>
            </ResizablePanel>
          </>
        ) : (
          <>
            <ResizablePanel defaultSize={50} minSize={18} className="min-w-0">
              <div className="flex h-full min-h-0 flex-col overflow-hidden pr-1">
                <SectionHeader
                  label="Input"
                  onCopy={() => copyToClipboard(row.inputText, "input")}
                />
                <p className="text-foreground/80 min-h-0 flex-1 overflow-y-auto leading-relaxed whitespace-pre-wrap">
                  {row.inputText}
                </p>
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={50} minSize={18} className="min-w-0">
              <div className="flex h-full min-h-0 flex-col overflow-hidden pl-1">
                <SectionHeader
                  label="Output"
                  onCopy={() => copyToClipboard(row.outputText ?? "", "output")}
                />
                <p className="text-foreground/80 min-h-0 flex-1 overflow-y-auto leading-relaxed whitespace-pre-wrap">
                  {row.outputText || (
                    <span className="text-muted-foreground/60 italic">
                      empty
                    </span>
                  )}
                </p>
              </div>
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </div>
  );
}

export function DetailDialog({ row, onClose, appName }: DetailDialogProps) {
  return (
    <Dialog open={row !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-card text-card-foreground ring-border flex max-h-[90vh] w-full max-w-5xl flex-col ring-1 sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle className="text-foreground text-sm font-semibold">
            Details
          </DialogTitle>
        </DialogHeader>
        {row && <DetailDialogBody key={row.id} row={row} appName={appName} />}
      </DialogContent>
    </Dialog>
  );
}
