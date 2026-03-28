import { useState } from "react";
import { cn } from "#/lib/utils";
import {
  filterComboboxItems,
  useComboboxSearchDirty,
} from "#/hooks/useComboboxSearchDirty";
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
  placeholder?: string;
  disabled?: boolean;
  /** When false, the clear control is hidden (e.g. URL rules must keep a prompt). */
  showClear?: boolean;
  /** Merged onto `ComboboxInput` (e.g. `w-full max-w-none` for form layouts). */
  inputClassName?: string;
}

export function AppPromptCombobox({
  prompts,
  assignedPromptId,
  onAssign,
  placeholder = "No prompt",
  disabled = false,
  showClear = true,
  inputClassName,
}: AppPromptComboboxProps) {
  const [query, setQuery] = useState("");
  const { searchDirty, onOpenChange, markSearchDirtyFromInput } =
    useComboboxSearchDirty();

  const selectedName =
    prompts.find((p) => p.id === assignedPromptId)?.name ?? "";

  const filtered = filterComboboxItems(
    prompts,
    query,
    searchDirty,
    (p) => p.name,
  );

  return (
    <Combobox
      value={selectedName}
      onValueChange={(name) => {
        onAssign(prompts.find((p) => p.name === name)?.id ?? "");
      }}
      onOpenChange={onOpenChange}
      onInputValueChange={setQuery}
    >
      <ComboboxInput
        placeholder={placeholder}
        disabled={disabled}
        showTrigger
        showClear={showClear && !!assignedPromptId}
        className={cn("max-w-64 min-w-40", inputClassName)}
        onInput={markSearchDirtyFromInput}
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
