import { useState } from "react";
import type { Prompt } from "#/stores";
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from "#/components/ui/combobox";

interface AppPromptComboboxProps {
  prompts: Prompt[];
  assignedPromptId: string;
  onAssign: (promptId: string) => void;
}

export function AppPromptCombobox({
  prompts,
  assignedPromptId,
  onAssign,
}: AppPromptComboboxProps) {
  const [query, setQuery] = useState("");

  const filtered = query
    ? prompts.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
    : prompts;

  const selectedName =
    prompts.find((p) => p.id === assignedPromptId)?.name ?? "";

  return (
    <Combobox
      value={selectedName}
      onValueChange={(name) => {
        onAssign(prompts.find((p) => p.name === name)?.id ?? "");
      }}
      onInputValueChange={setQuery}
    >
      <ComboboxInput
        placeholder="No prompt"
        showTrigger
        showClear={!!assignedPromptId}
        className="max-w-64 min-w-40"
      />
      <ComboboxContent className="min-w-56">
        {filtered.length === 0 && (
          <ComboboxEmpty>No prompts found</ComboboxEmpty>
        )}
        <ComboboxList>
          {filtered.map((p) => (
            <ComboboxItem key={p.id} value={p.name} className="py-2 pl-3">
              {p.name}
            </ComboboxItem>
          ))}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
