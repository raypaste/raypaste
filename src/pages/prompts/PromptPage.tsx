import { useState } from "react";
import { Star, Trash2, Lock } from "lucide-react";
import { cn } from "#/lib/utils";
import { Button } from "#/components/ui/button";
import { usePromptsStore } from "#/stores";
import { PromptAppSelector } from "#/pages/prompts/PromptAppSelector";

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
    websitePromptSites,
  } = usePromptsStore();
  const prompt = prompts.find((p) => p.id === promptId);

  const [name, setName] = useState(prompt?.name ?? "");
  const [text, setText] = useState(prompt?.text ?? "");
  const [notes, setNotes] = useState(prompt?.notes ?? "");
  const [dirty, setDirty] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!prompt) {
    return null;
  }

  const isDefault = defaultPromptId === promptId;
  const websiteRules = websitePromptSites.flatMap((site) =>
    site.rules
      .filter((rule) => rule.promptId === promptId)
      .map((rule) => ({
        id: rule.id,
        pattern: rule.kind === "site" ? site.domain : rule.value,
      })),
  );

  function handleSave() {
    if (!name.trim() || !text.trim()) {
      return;
    }
    updatePrompt(promptId, {
      name: name.trim(),
      text: text.trim(),
      notes: notes.trim(),
    });
    setDirty(false);
  }

  function handleDelete() {
    if (confirmDelete) {
      if (isDefault) {
        setDefaultPrompt(null);
      }
      deletePrompt(promptId);
      onDeleted();
    } else {
      setConfirmDelete(true);
    }
  }

  return (
    <div className="flex h-full items-start justify-center overflow-auto px-6 py-12 pb-20">
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
          <Button onClick={handleSave} disabled={!name.trim() || !text.trim()}>
            Save changes
          </Button>
        )}

        <PromptAppSelector
          assignedAppIds={prompt.appIds}
          onChange={(newIds) => {
            const added = newIds.filter((id) => !prompt.appIds.includes(id));
            const removed = prompt.appIds.filter((id) => !newIds.includes(id));
            added.forEach((id) => assignAppToPrompt(promptId, id));
            removed.forEach((id) => unassignApp(id));
          }}
        />

        <div className="space-y-2">
          <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
            Website prompts using this prompt
          </p>
          {websiteRules.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              This prompt is not currently used by any website prompt.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {websiteRules.map((rule) => (
                <span
                  key={rule.id}
                  className="border-border bg-muted/30 text-foreground rounded-full border px-2.5 py-1 text-xs"
                >
                  {rule.pattern || "Untitled website prompt"}
                </span>
              ))}
            </div>
          )}
        </div>

        <div>
          <Button
            variant="outline"
            onClick={() => setDefaultPrompt(isDefault ? null : promptId)}
            className={cn(
              "gap-1 px-2 py-1.5 text-xs font-medium",
              isDefault
                ? "border-primary/60 bg-primary/20 text-primary"
                : "border-border bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:text-foreground",
            )}
          >
            <Star className={cn("h-3 w-3", isDefault && "fill-primary")} />
            {isDefault ? "Default Prompt" : "Set as Default Prompt"}
          </Button>
        </div>

        <div className="border-border border-t pt-4">
          <Button
            variant={confirmDelete ? "destructive" : "ghost"}
            onClick={handleDelete}
            className={cn(
              "gap-2 px-3 py-1.5 text-xs font-medium",
              confirmDelete &&
                "border-destructive/60 bg-destructive/20 hover:bg-destructive/25 border",
              !confirmDelete &&
                "text-muted-foreground/60 hover:bg-transparent hover:text-red-400",
            )}
          >
            <Trash2 className="h-3.5 w-3.5" />
            {confirmDelete ? "Click again to confirm delete" : "Delete prompt"}
          </Button>
        </div>
      </div>
    </div>
  );
}
