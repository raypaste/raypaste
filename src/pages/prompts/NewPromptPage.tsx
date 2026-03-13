import { useState } from "react";
import { Lock } from "lucide-react";
import { cn } from "#/lib/utils";
import { usePromptsStore } from "#/stores";
import { PromptAppSelector } from "#/pages/prompts/PromptAppSelector";

interface NewPromptPageProps {
  onCreated: (id: string) => void;
}

export function NewPromptPage({ onCreated }: NewPromptPageProps) {
  const { addPrompt, assignAppToPrompt } = usePromptsStore();
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedAppIds, setSelectedAppIds] = useState<string[]>([]);

  function handleSave() {
    if (!name.trim() || !text.trim()) return;
    const id = crypto.randomUUID();
    addPrompt({
      id,
      name: name.trim(),
      text: text.trim(),
      notes: notes.trim(),
    });
    for (const appId of selectedAppIds) {
      assignAppToPrompt(id, appId);
    }
    onCreated(id);
  }

  const canSave = name.trim().length > 0 && text.trim().length > 0;

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
            onChange={(e) => setName(e.target.value)}
            placeholder="Prompt name, e.g. Draft a formal email"
            autoFocus
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
              onChange={(e) => setText(e.target.value)}
              placeholder="Describe what you want the AI to do with the selected text..."
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
              onChange={(e) => setNotes(e.target.value)}
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

        <PromptAppSelector
          assignedAppIds={selectedAppIds}
          onChange={setSelectedAppIds}
        />

        <button
          onClick={handleSave}
          disabled={!canSave}
          className={cn(
            "cursor-pointer rounded-lg px-4 py-2 text-sm font-medium transition-colors",
            canSave
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "bg-muted text-muted-foreground cursor-not-allowed",
          )}
        >
          Save Prompt
        </button>
      </div>
    </div>
  );
}
