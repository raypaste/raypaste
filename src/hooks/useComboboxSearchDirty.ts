import { useCallback, useState } from "react";

/** inputTypes that indicate the user edited the field (not programmatic sync). */
const USER_INPUT_TYPES = new Set([
  "insertText",
  "insertCompositionText",
  "insertFromPaste",
  "insertReplacementText",
  "deleteContentBackward",
  "deleteContentForward",
  "deleteByCut",
  "historyUndo",
  "historyRedo",
]);

/**
 * Single-select searchable comboboxes sync the input to the selected label when
 * opened, which makes client-side filtering show only one row. Reset on open and
 * only apply the filter after the user actually edits the input.
 */
export function useComboboxSearchDirty() {
  const [searchDirty, setSearchDirty] = useState(false);

  const onOpenChange = useCallback((open: boolean) => {
    if (open) setSearchDirty(false);
  }, []);

  const markSearchDirtyFromInput = useCallback(
    (e: React.FormEvent<HTMLInputElement>) => {
      const ie = e.nativeEvent as InputEvent;
      if (USER_INPUT_TYPES.has(ie.inputType)) {
        setSearchDirty(true);
      }
    },
    [],
  );

  return { searchDirty, onOpenChange, markSearchDirtyFromInput };
}

export function filterComboboxItems<T>(
  items: T[],
  query: string,
  searchDirty: boolean,
  getLabel: (item: T) => string,
): T[] {
  if (!searchDirty) return items;
  return query
    ? items.filter((item) =>
        getLabel(item).toLowerCase().includes(query.toLowerCase()),
      )
    : items;
}
