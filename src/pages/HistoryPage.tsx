import { useState, useEffect, useCallback, useRef } from "react";
import { listen } from "@tauri-apps/api/event";
import {
  Search,
  CheckCircle2,
  XCircle,
  MinusCircle,
  BarChart2,
  MessageSquare,
  Trash2,
  X,
} from "lucide-react";
import { useAppsStore } from "#/stores";
import {
  listCompletions,
  listDistinctPrompts,
  getUsageStats,
  deleteCompletion,
  clearAllCompletions,
  resetAllHistory,
  type CompletionEntry,
  type UsageStatsRow,
} from "#/services/db";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "#/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "#/components/ui/alert-dialog";

const LIST_LIMIT = 200;

// ── helpers ────────────────────────────────────────────────────────────────

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? "1 month ago" : `${months} months ago`;
}

function avgTokPerSec(stats: UsageStatsRow): string {
  if (!stats.totalCompletionMs) return "—";
  return ((stats.totalOutputTokens / stats.totalCompletionMs) * 1000).toFixed(
    1,
  );
}

function avgCompletionTime(stats: UsageStatsRow): string {
  if (!stats.totalCompletions) return "—";
  return (
    (stats.totalCompletionMs / stats.totalCompletions / 1000).toFixed(2) + "s"
  );
}

function appColor(str: string): string {
  let hash = 0;
  for (const ch of str) hash = ch.charCodeAt(0) + ((hash << 5) - hash);
  const h = Math.abs(hash) % 360;
  return `hsl(${h},38%,36%)`;
}

// ── sub-components ─────────────────────────────────────────────────────────

function StatusIcon({ row }: { row: CompletionEntry }) {
  if (row.hadError)
    return <XCircle size={13} className="shrink-0 text-red-500" />;
  if (row.wasApplied)
    return <CheckCircle2 size={13} className="shrink-0 text-emerald-500" />;
  return <MinusCircle size={13} className="shrink-0 text-neutral-600" />;
}

interface EntryCardProps {
  row: CompletionEntry;
  appName: (id: string) => string;
  onClick: () => void;
  onDelete: () => void;
}

function EntryCard({ row, appName, onClick, onDelete }: EntryCardProps) {
  const name = appName(row.appId);
  const initial = name.charAt(0).toUpperCase();

  return (
    <button
      type="button"
      onClick={onClick}
      className="group/card w-full cursor-pointer border-b border-white/6 px-4 py-3 text-left transition-colors hover:bg-white/4"
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
          <span className="truncate text-[11px] text-neutral-400">{name}</span>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <StatusIcon row={row} />
          <span className="text-[11px] whitespace-nowrap text-neutral-500">
            {timeAgo(row.timestamp)}
          </span>
        </div>
      </div>

      {/* Prompt name */}
      <p className="mb-0.5 text-[13px] leading-snug font-semibold text-neutral-200">
        {row.promptName}
      </p>

      {/* Input preview */}
      <p className="line-clamp-2 text-[11px] leading-relaxed text-neutral-500">
        {row.hadError ? (
          <span className="text-red-500/70">{row.errorMessage}</span>
        ) : (
          row.inputText
        )}
      </p>

      {/* Delete (hover) */}
      <div className="mt-1.5 flex justify-end opacity-0 transition-opacity group-hover/card:opacity-100">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="rounded p-0.5 text-neutral-600 transition-colors hover:text-red-400"
        >
          <XCircle size={12} />
        </button>
      </div>
    </button>
  );
}

interface DetailDialogProps {
  row: CompletionEntry | null;
  onClose: () => void;
  appName: (id: string) => string;
}

function DetailDialog({ row, onClose, appName }: DetailDialogProps) {
  return (
    <Dialog open={row !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg bg-neutral-900 text-neutral-100 ring-1 ring-white/10">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold text-neutral-200">
            Completion detail
          </DialogTitle>
        </DialogHeader>
        {row && (
          <div className="flex flex-col gap-4 text-xs">
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-neutral-500">
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

            {!!row.isReviewMode && row.finalText !== null && (
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

// Shared dialog content style
const DIALOG_CONTENT_CLS =
  "bg-neutral-950 border border-white/10 shadow-2xl shadow-black/60 ring-0 max-w-sm text-neutral-100";
const DIALOG_CANCEL_CLS =
  "border border-white/10 bg-neutral-900 text-neutral-300 hover:bg-white/8 hover:text-neutral-100";
const DIALOG_ACTION_DESTRUCTIVE_CLS =
  "bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 hover:text-red-300";

function ClearHistoryDialog({ onConfirm }: { onConfirm: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/8 bg-white/3 px-4 py-2 text-[12px] text-neutral-400 transition-colors hover:border-white/12 hover:bg-white/5 hover:text-neutral-200"
          />
        }
      >
        <X size={12} />
        Clear history
      </AlertDialogTrigger>
      <AlertDialogContent size="sm" className={DIALOG_CONTENT_CLS}>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-white/6">
            <X className="text-neutral-300" />
          </AlertDialogMedia>
          <AlertDialogTitle className="text-[15px] font-semibold">
            Clear history?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-neutral-500">
            All log entries will be permanently deleted. Overview stats are
            preserved.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className={DIALOG_CANCEL_CLS}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              onConfirm();
              setOpen(false);
            }}
            className={DIALOG_ACTION_DESTRUCTIVE_CLS}
          >
            Clear
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function ResetAllDialog({ onConfirm }: { onConfirm: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-900/40 bg-red-950/20 px-4 py-2 text-[12px] text-red-500/70 transition-colors hover:border-red-800/50 hover:bg-red-950/40 hover:text-red-400"
          />
        }
      >
        <Trash2 size={12} />
        Reset all data
      </AlertDialogTrigger>
      <AlertDialogContent size="sm" className={DIALOG_CONTENT_CLS}>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-red-500/10">
            <Trash2 className="text-red-400" />
          </AlertDialogMedia>
          <AlertDialogTitle className="text-[15px] font-semibold">
            Reset all data?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-neutral-500">
            Permanently deletes all log entries{" "}
            <span className="text-neutral-300">and</span> resets all stats to
            zero. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className={DIALOG_CANCEL_CLS}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              onConfirm();
              setOpen(false);
            }}
            className={DIALOG_ACTION_DESTRUCTIVE_CLS}
          >
            Reset everything
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

interface OverviewPanelProps {
  stats: UsageStatsRow;
  promptNames: Record<string, string>;
  onClearHistory: () => void;
  onResetAll: () => void;
}

function OverviewPanel({
  stats,
  promptNames,
  onClearHistory,
  onResetAll,
}: OverviewPanelProps) {
  const mostUsedPromptId =
    Object.keys(stats.promptStats).sort(
      (a, b) =>
        (stats.promptStats[b]?.uses ?? 0) - (stats.promptStats[a]?.uses ?? 0),
    )[0] ?? null;
  const mostUsedPromptName = mostUsedPromptId
    ? (promptNames[mostUsedPromptId] ?? mostUsedPromptId)
    : "—";

  const promptEntries = Object.entries(stats.promptStats).sort(
    ([, a], [, b]) => b.uses - a.uses,
  );

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto px-6 py-5">
      {/* OVERVIEW */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <BarChart2 size={13} className="text-neutral-500" />
          <h3 className="text-[11px] font-semibold tracking-[0.14em] text-neutral-500 uppercase">
            Overview
          </h3>
        </div>
        <div className="overflow-hidden rounded-xl border border-white/8 bg-white/3">
          {(
            [
              { label: "Total Completions", value: stats.totalCompletions },
              { label: "Avg. Tokens / sec", value: avgTokPerSec(stats) },
              {
                label: "Avg. Completion Time",
                value: avgCompletionTime(stats),
              },
              { label: "Most Used Prompt", value: mostUsedPromptName },
            ] as { label: string; value: string | number }[]
          ).map(({ label, value }, i) => (
            <div
              key={label}
              className={`flex items-center justify-between px-4 py-2.5 ${i > 0 ? "border-t border-white/6" : ""}`}
            >
              <span className="text-[13px] text-neutral-300">{label}</span>
              <span className="text-[13px] font-medium text-neutral-100">
                {value}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* PER PROMPT */}
      {promptEntries.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <MessageSquare size={13} className="text-neutral-500" />
            <h3 className="text-[11px] font-semibold tracking-[0.14em] text-neutral-500 uppercase">
              Per Prompt
            </h3>
          </div>
          <div className="overflow-hidden rounded-xl border border-white/8 bg-white/3">
            {promptEntries.map(([id, data], i) => (
              <div
                key={id}
                className={`flex items-center justify-between px-4 py-2.5 ${i > 0 ? "border-t border-white/6" : ""}`}
              >
                <span className="truncate text-[13px] text-neutral-300">
                  {promptNames[id] ?? id}
                </span>
                <span className="ml-4 shrink-0 text-[13px] font-medium text-neutral-100">
                  {data.uses}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Actions */}
      <section className="mt-auto flex flex-col gap-2 pt-2">
        <ClearHistoryDialog onConfirm={onClearHistory} />
        <ResetAllDialog onConfirm={onResetAll} />
      </section>
    </div>
  );
}

// ── main component ─────────────────────────────────────────────────────────

export function HistoryPage() {
  const [rows, setRows] = useState<CompletionEntry[]>([]);
  const [stats, setStats] = useState<UsageStatsRow | null>(null);
  const [promptNames, setPromptNames] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [detailRow, setDetailRow] = useState<CompletionEntry | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { apps } = useAppsStore();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const appName = useCallback(
    (bundleId: string) =>
      apps.find((a) => a.bundleId === bundleId)?.name ?? bundleId,
    [apps],
  );

  // Fetch data whenever refreshKey or debouncedSearch changes
  useEffect(() => {
    const query = debouncedSearch || undefined;
    Promise.all([
      listCompletions(LIST_LIMIT, 0, query),
      getUsageStats(),
      listDistinctPrompts(),
    ])
      .then(([fetched, s, names]) => {
        setRows(fetched);
        setStats(s);
        setPromptNames(
          Object.fromEntries(names.map((n) => [n.promptId, n.promptName])),
        );
      })
      .catch(() => {});
  }, [refreshKey, debouncedSearch]);

  // Refresh when a new completion is saved
  const doRefresh = useCallback(() => setRefreshKey((k) => k + 1), []);
  useEffect(() => {
    const unlisten = listen("raypaste://completion-saved", doRefresh);
    return () => {
      unlisten.then((fn) => fn());
    };
  }, [doRefresh]);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(val), 250);
  };

  const handleDelete = (id: string) => {
    deleteCompletion(id)
      .then(() => {
        setDeletingId(null);
        setRefreshKey((k) => k + 1);
      })
      .catch(() => {});
  };

  const handleClearHistory = () => {
    clearAllCompletions()
      .then(() => setRefreshKey((k) => k + 1))
      .catch(() => {});
  };

  const handleResetAll = () => {
    resetAllHistory()
      .then(() => {
        setSearch("");
        setDebouncedSearch("");
        setRefreshKey((k) => k + 1);
      })
      .catch(() => {});
  };

  const isEmpty = !stats || stats.totalCompletions === 0;

  return (
    <div className="flex h-full overflow-hidden">
      {/* ── Left panel ── */}
      <div className="flex w-[42%] shrink-0 flex-col border-r border-white/6">
        {/* Search */}
        <div className="shrink-0 border-b border-white/6 px-4 py-3">
          <div className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2">
            <Search size={13} className="shrink-0 text-neutral-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search history…"
              className="w-full bg-transparent text-[13px] text-neutral-200 placeholder:text-neutral-600 focus:outline-none"
            />
          </div>
        </div>

        {/* List */}
        {isEmpty ? (
          <div className="flex flex-1 items-center justify-center text-[13px] text-neutral-600">
            No completions yet.
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-1 items-center justify-center text-[13px] text-neutral-600">
            No results.
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {rows.map((row) => (
              <EntryCard
                key={row.id}
                row={row}
                appName={appName}
                onClick={() => setDetailRow(row)}
                onDelete={() => setDeletingId(row.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 overflow-hidden">
        {stats ? (
          <OverviewPanel
            stats={stats}
            promptNames={promptNames}
            onClearHistory={handleClearHistory}
            onResetAll={handleResetAll}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-[13px] text-neutral-600">
            Loading…
          </div>
        )}
      </div>

      {/* Detail dialog */}
      <DetailDialog
        row={detailRow}
        onClose={() => setDetailRow(null)}
        appName={appName}
      />

      {/* Delete confirmation */}
      <AlertDialog
        open={deletingId !== null}
        onOpenChange={(open) => !open && setDeletingId(null)}
      >
        <AlertDialogContent size="sm" className={DIALOG_CONTENT_CLS}>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-white/6">
              <Trash2 className="text-neutral-300" />
            </AlertDialogMedia>
            <AlertDialogTitle className="text-[15px] font-semibold">
              Delete this entry?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-neutral-500">
              This log entry will be permanently removed. Stats are not
              affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className={DIALOG_CANCEL_CLS}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingId) handleDelete(deletingId);
              }}
              className={DIALOG_ACTION_DESTRUCTIVE_CLS}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
