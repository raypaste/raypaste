import { XCircle } from "lucide-react";
import type { CompletionEntry } from "#/services/db";
import { timeAgo, appColor } from "./helpers";
import { StatusIcon } from "./StatusIcon";

interface EntryCardProps {
  row: CompletionEntry;
  appName: (id: string) => string;
  onClick: () => void;
  onDelete: () => void;
}

export function EntryCard({ row, appName, onClick, onDelete }: EntryCardProps) {
  const name = appName(row.appId);
  const initial = name.charAt(0).toUpperCase();

  return (
    <button
      type="button"
      onClick={onClick}
      className="group/card border-border hover:bg-muted/40 w-full cursor-pointer border-b px-4 pt-3 pb-1.5 text-left transition-colors"
    >
      {/* App + time */}
      <div className="mb-1 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
            style={{ backgroundColor: appColor(row.appId) }}
          >
            {initial}
          </span>
          <span className="text-muted-foreground truncate text-[11px]">
            {name}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {row.isReviewMode ? (
            <span className="flex items-center gap-0.5 rounded-full bg-violet-500/15 px-1.5 py-0.5 text-[10px] text-violet-500">
              Review
            </span>
          ) : (
            <span className="rounded-full bg-sky-500/12 px-1.5 py-0.5 text-[10px] text-sky-500">
              Instant
            </span>
          )}
          <StatusIcon row={row} />
          <span className="text-muted-foreground text-[11px] whitespace-nowrap">
            {timeAgo(row.timestamp)}
          </span>
        </div>
      </div>

      {/* Prompt name */}
      <p className="text-foreground mb-0.5 text-[13px] leading-snug font-semibold">
        {row.promptName}
      </p>

      {/* Input preview */}
      <p className="text-muted-foreground line-clamp-2 text-[11px] leading-relaxed">
        {row.hadError ? (
          <span className="text-red-500/70">{row.errorMessage}</span>
        ) : (
          row.inputText
        )}
      </p>

      {/* Delete (hover) */}
      <div className="mt-0.5 flex justify-end opacity-0 transition-opacity group-hover/card:opacity-100">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="text-muted-foreground/60 rounded p-0.5 transition-colors hover:cursor-pointer hover:text-red-400"
        >
          <XCircle size={12} />
        </button>
      </div>
    </button>
  );
}
