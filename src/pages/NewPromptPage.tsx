import { useState } from "react";
import { Lock } from "lucide-react";
import { cn } from "#/lib/utils";
import { usePromptsStore } from "#/stores";

interface NewPromptPageProps {
  onCreated: (id: string) => void;
}

export function NewPromptPage({ onCreated }: NewPromptPageProps) {
  const { addPrompt } = usePromptsStore();
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [notes, setNotes] = useState("");

  function handleSave() {
    if (!name.trim() || !text.trim()) return;
    const id = crypto.randomUUID();
    addPrompt({
      id,
      name: name.trim(),
      text: text.trim(),
      notes: notes.trim(),
    });
    onCreated(id);
  }

  const canSave = name.trim().length > 0 && text.trim().length > 0;

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
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Make formal"
            autoFocus
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
          <div className="rounded-lg border border-neutral-700 bg-neutral-800 focus-within:border-neutral-500">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Describe what you want the AI to do with the selected text..."
              rows={6}
              className={cn(
                "w-full resize-none bg-transparent px-3 py-3 text-sm text-neutral-200",
                "placeholder:text-neutral-500 focus:outline-none",
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
          <div className="rounded-lg border border-neutral-700 bg-neutral-800 focus-within:border-neutral-500">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes for yourself..."
              rows={3}
              className={cn(
                "w-full resize-none bg-transparent px-3 py-3 text-sm text-neutral-200",
                "placeholder:text-neutral-500 focus:outline-none",
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

        <button
          onClick={handleSave}
          disabled={!canSave}
          className={cn(
            "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
            canSave
              ? "bg-neutral-200 text-neutral-900 hover:bg-white"
              : "cursor-not-allowed bg-white/8 text-neutral-600",
          )}
        >
          Save Prompt
        </button>
      </div>
    </div>
  );
}
