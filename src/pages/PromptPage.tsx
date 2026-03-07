import { useEffect, useState } from "react";
import { Star, Plus, X, Trash2, Lock } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { cn } from "#/lib/utils";
import { usePromptsStore, useAppsStore } from "#/stores";
import type { InstalledApp } from "#/stores";

interface PromptPageProps {
  promptId: string;
  onDeleted: () => void;
}

export function PromptPage({ promptId, onDeleted }: PromptPageProps) {
  const {
    prompts,
    updatePrompt,
    deletePrompt,
    assignAppToPrompt,
    unassignApp,
    defaultPromptId,
    setDefaultPrompt,
  } = usePromptsStore();
  const { apps, setApps } = useAppsStore();

  const prompt = prompts.find((p) => p.id === promptId);

  const [name, setName] = useState(prompt?.name ?? "");
  const [text, setText] = useState(prompt?.text ?? "");
  const [notes, setNotes] = useState(prompt?.notes ?? "");
  const [dirty, setDirty] = useState(false);
  const [showAddApp, setShowAddApp] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (apps.length > 0) return;
    invoke<InstalledApp[]>("list_apps")
      .then(setApps)
      .catch(() => {});
  }, [apps.length, setApps]);

  if (!prompt) return null;

  const isDefault = defaultPromptId === promptId;
  const assignedApps = apps.filter((a) => prompt.appIds.includes(a.bundleId));
  const availableApps = apps.filter((a) => !prompt.appIds.includes(a.bundleId));

  function handleSave() {
    if (!name.trim() || !text.trim()) return;
    updatePrompt(promptId, {
      name: name.trim(),
      text: text.trim(),
      notes: notes.trim(),
    });
    setDirty(false);
  }

  function handleDelete() {
    if (confirmDelete) {
      if (isDefault) setDefaultPrompt(null);
      deletePrompt(promptId);
      onDeleted();
    } else {
      setConfirmDelete(true);
    }
  }

  return (
    <div className="flex h-full items-start justify-center overflow-auto px-6 py-12">
      <div className="w-full max-w-2xl space-y-6">
        <div className="space-y-2">
          <label className="text-xs font-semibold tracking-wider text-neutral-400 uppercase">
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setDirty(true);
            }}
            className={cn(
              "w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-200 focus-within:border-neutral-500",
              "placeholder:text-neutral-500 focus:outline-none",
            )}
          />
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold tracking-wider text-neutral-400 uppercase">
            Prompt
          </p>
          <div className="rounded-lg border border-white/10 bg-white/5">
            <textarea
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setDirty(true);
              }}
              rows={6}
              className={cn(
                "w-full resize-none bg-transparent px-3 py-3 text-sm text-neutral-200",
                "placeholder:text-neutral-600 focus:outline-none",
              )}
            />
            <div className="border-t border-white/8 px-3 py-2">
              <p className="text-xs text-neutral-500">
                Required — this is sent to the LLM as the system prompt.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold tracking-wider text-neutral-400 uppercase">
            Notes
          </p>
          <div className="rounded-lg border border-white/10 bg-white/5">
            <textarea
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                setDirty(true);
              }}
              placeholder="Optional notes for yourself..."
              rows={3}
              className={cn(
                "w-full resize-none bg-transparent px-3 py-3 text-sm text-neutral-200",
                "placeholder:text-neutral-600 focus:outline-none",
              )}
            />
            <div className="flex items-center gap-1.5 border-t border-white/8 px-3 py-2">
              <Lock className="h-3 w-3 text-neutral-600" />
              <p className="text-xs text-neutral-500">
                Private — never sent to the LLM.
              </p>
            </div>
          </div>
        </div>

        {dirty && (
          <button
            onClick={handleSave}
            disabled={!name.trim() || !text.trim()}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              name.trim() && text.trim()
                ? "bg-neutral-200 text-neutral-900 hover:bg-white"
                : "cursor-not-allowed bg-white/8 text-neutral-600",
            )}
          >
            Save changes
          </button>
        )}

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold tracking-wider text-neutral-400 uppercase">
              Apps using this prompt
            </p>
            <div className="relative">
              <button
                onClick={() => setShowAddApp((v) => !v)}
                className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-neutral-300 transition-colors hover:bg-white/10 hover:text-white"
              >
                <Plus className="h-3 w-3" />
                Add App
              </button>
              {showAddApp && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowAddApp(false)}
                  />
                  <div className="absolute top-full right-0 z-50 mt-1 max-h-52 w-60 overflow-auto rounded-lg border border-white/10 bg-neutral-900 shadow-xl">
                    {availableApps.length === 0 ? (
                      <p className="px-2 py-1 text-xs text-neutral-500">
                        {apps.length === 0
                          ? "No apps loaded yet."
                          : "All apps already assigned."}
                      </p>
                    ) : (
                      availableApps.map((app) => (
                        <button
                          key={app.bundleId}
                          onClick={() => {
                            assignAppToPrompt(promptId, app.bundleId);
                            setShowAddApp(false);
                          }}
                          className="flex w-full flex-col px-2 py-1 text-left transition-colors hover:bg-white/8"
                        >
                          <span className="text-xs font-medium text-neutral-200">
                            {app.name}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-white/8 bg-white/3 p-3">
            {assignedApps.length === 0 ? (
              <p className="text-sm text-neutral-500">
                No apps assigned — click Add App to link one.
              </p>
            ) : (
              <div className="space-y-0.5">
                {assignedApps.map((app) => (
                  <div
                    key={app.bundleId}
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-white/5"
                  >
                    <span className="flex-1 text-sm text-neutral-200">
                      {app.name}
                    </span>
                    <button
                      onClick={() => unassignApp(app.bundleId)}
                      className="text-neutral-600 transition-colors hover:text-red-400"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <button
            onClick={() => setDefaultPrompt(isDefault ? null : promptId)}
            className={cn(
              "flex items-center gap-1 rounded-lg border p-2 text-xs font-medium transition-colors",
              isDefault
                ? "border-green-800/50 bg-green-900/40 text-green-400"
                : "border-white/10 bg-white/5 text-neutral-300 hover:bg-white/10 hover:text-white",
            )}
          >
            <Star className={cn("h-4 w-4", isDefault && "fill-green-400")} />
            {isDefault ? "Default Prompt" : "Set as Default Prompt"}
          </button>
        </div>

        <div className="border-t border-white/6 pt-4">
          <button
            onClick={handleDelete}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
              confirmDelete
                ? "border border-red-800/40 bg-red-900/30 text-red-400"
                : "text-neutral-600 hover:text-red-400",
            )}
          >
            <Trash2 className="h-3.5 w-3.5" />
            {confirmDelete ? "Click again to confirm delete" : "Delete prompt"}
          </button>
        </div>
      </div>
    </div>
  );
}
