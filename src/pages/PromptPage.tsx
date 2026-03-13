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
          <label className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
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
              "border-border bg-muted/30 text-foreground focus-within:border-ring w-full rounded-lg border px-3 py-2 text-sm",
              "placeholder:text-muted-foreground focus:outline-none",
            )}
          />
        </div>

        <div className="space-y-2">
          <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
            Prompt
          </p>
          <div className="border-border bg-muted/30 focus-within:border-ring rounded-lg border">
            <textarea
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setDirty(true);
              }}
              rows={6}
              className={cn(
                "text-foreground w-full resize-none bg-transparent px-3 py-3 text-sm",
                "placeholder:text-muted-foreground focus:outline-none",
              )}
            />
            <div className="border-border border-t px-3 py-2">
              <p className="text-muted-foreground text-xs">
                Required — this is sent to the LLM as the system prompt.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
            Notes
          </p>
          <div className="border-border bg-muted/30 focus-within:border-ring rounded-lg border">
            <textarea
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                setDirty(true);
              }}
              placeholder="Optional notes for yourself..."
              rows={3}
              className={cn(
                "text-foreground w-full resize-none bg-transparent px-3 py-3 text-sm",
                "placeholder:text-muted-foreground focus:outline-none",
              )}
            />
            <div className="border-border flex items-center gap-1.5 border-t px-3 py-2">
              <Lock className="text-muted-foreground/60 h-3 w-3" />
              <p className="text-muted-foreground text-xs">
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
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-muted/40 text-muted-foreground cursor-not-allowed",
            )}
          >
            Save changes
          </button>
        )}

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
              Apps using this prompt
            </p>
            <div className="relative">
              <button
                onClick={() => setShowAddApp((v) => !v)}
                className="border-border bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:text-foreground flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors"
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
                  <div className="border-border bg-popover absolute top-full right-0 z-50 mt-1 max-h-52 w-60 overflow-auto rounded-lg border shadow-xl">
                    {availableApps.length === 0 ? (
                      <p className="text-muted-foreground px-2 py-1 text-xs">
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
                          className="hover:bg-muted/50 flex w-full flex-col px-2 py-1 text-left transition-colors"
                        >
                          <span className="text-foreground text-xs font-medium">
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

          <div className="border-border bg-muted/20 rounded-lg border p-3">
            {assignedApps.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No apps assigned — click Add App to link one.
              </p>
            ) : (
              <div className="space-y-0.5">
                {assignedApps.map((app) => (
                  <div
                    key={app.bundleId}
                    className="hover:bg-muted/30 flex items-center gap-2 rounded-md px-2 py-1.5"
                  >
                    <span className="text-foreground flex-1 text-sm">
                      {app.name}
                    </span>
                    <button
                      onClick={() => unassignApp(app.bundleId)}
                      className="text-muted-foreground/60 transition-colors hover:text-red-400"
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
              "flex items-center gap-1 rounded-lg border px-2 py-1.5 text-xs font-medium",
              isDefault
                ? "border-primary/60 bg-primary/20 text-primary"
                : "border-border bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:text-foreground",
            )}
          >
            <Star className={cn("h-3 w-3", isDefault && "fill-primary")} />
            {isDefault ? "Default Prompt" : "Set as Default Prompt"}
          </button>
        </div>

        <div className="border-border border-t pt-4">
          <button
            onClick={handleDelete}
            className={cn(
              "flex cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium",
              confirmDelete
                ? "border-destructive/60 bg-destructive/20 text-destructive border"
                : "text-muted-foreground/60 hover:text-red-400",
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
