import { useState } from "react";
import { BarChart2, MessageSquare, X, Trash2 } from "lucide-react";
import type { UsageStatsRow } from "#/services/db";
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
import { avgTokPerSec, avgCompletionTime } from "./helpers";
import {
  DIALOG_CONTENT_CLS,
  DIALOG_CANCEL_CLS,
  DIALOG_ACTION_DESTRUCTIVE_CLS,
} from "#/components/history/constants";

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

export function OverviewPanel({
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
    <div className="flex h-full flex-col gap-6 overflow-y-auto border-t px-6 py-5">
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
