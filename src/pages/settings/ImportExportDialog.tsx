import { useRef, useState } from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { cn } from "#/lib/utils";
import {
  parseImportPayload,
  type ImportMode,
  type ImportPreview,
} from "#/lib/promptsImportExport";
import { usePromptsStore } from "#/stores";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "#/components/ui/dialog";
import { Button } from "#/components/ui/button";
import { Textarea } from "#/components/ui/textarea";
import { toast } from "#/hooks/useToast";

interface ImportExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Tab = "file" | "paste";

export function ImportExportDialog({
  open,
  onOpenChange,
}: ImportExportDialogProps) {
  const [tab, setTab] = useState<Tab>("file");
  const [importMode, setImportMode] = useState<ImportMode>("merge");
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pasteText, setPasteText] = useState("");
  const [selectedFileName, setSelectedFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function resetImportForm() {
    setTab("file");
    setImportMode("merge");
    setPreview(null);
    setError(null);
    setPasteText("");
    setSelectedFileName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleOpenChange(next: boolean) {
    if (!next) resetImportForm();
    onOpenChange(next);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setSelectedFileName("");
      return;
    }
    setSelectedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const result = parseImportPayload(ev.target?.result as string);
        setPreview(result);
        setError(null);
      } catch (err) {
        setPreview(null);
        setError(err instanceof Error ? err.message : "Invalid file");
      }
    };
    reader.readAsText(file);
  }

  function handlePasteChange(text: string) {
    setPasteText(text);
    if (!text.trim()) {
      setPreview(null);
      setError(null);
      return;
    }
    try {
      const result = parseImportPayload(text);
      setPreview(result);
      setError(null);
    } catch (err) {
      setPreview(null);
      setError(err instanceof Error ? err.message : "Invalid JSON");
    }
  }

  function handleImport() {
    if (!preview) return;
    const { importedPromptCount, importedSiteCount } = usePromptsStore
      .getState()
      .importPrompts(preview.payload, importMode);
    const parts = [
      `${importedPromptCount} prompt${importedPromptCount !== 1 ? "s" : ""}`,
    ];
    if (importedSiteCount > 0) {
      parts.push(
        `${importedSiteCount} website site${importedSiteCount !== 1 ? "s" : ""}`,
      );
    }
    toast.success(`Imported ${parts.join(" and ")}`);
    handleOpenChange(false);
  }

  const importLabel = preview
    ? `Import ${preview.promptCount} prompt${preview.promptCount !== 1 ? "s" : ""}`
    : "Import";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg" showCloseButton>
        <DialogHeader>
          <DialogTitle>Import Prompts</DialogTitle>
        </DialogHeader>

        {/* Tab switcher */}
        <div className="bg-muted/50 flex gap-1 rounded-lg p-1">
          {(["file", "paste"] as const).map((t) => (
            <button
              key={t}
              onClick={() => {
                setTab(t);
                setPreview(null);
                setError(null);
                if (t === "paste") {
                  setSelectedFileName("");
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }
              }}
              className={cn(
                "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                tab === t
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t === "file" ? "Upload File" : "Paste JSON"}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="min-h-[120px]">
          {tab === "file" ? (
            <div className="flex flex-col items-start gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                className="sr-only"
                onChange={handleFileChange}
                id="import-file-input"
              />
              <label
                htmlFor="import-file-input"
                className="border-input bg-background hover:bg-muted/50 inline-flex cursor-pointer items-center rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors"
              >
                Choose JSON file
              </label>
              {selectedFileName && (
                <p className="text-muted-foreground text-xs">
                  {selectedFileName}
                </p>
              )}
            </div>
          ) : (
            <Textarea
              value={pasteText}
              onChange={(e) => handlePasteChange(e.target.value)}
              placeholder="Paste exported JSON here..."
              className="field-sizing:fixed min-h-[140px] resize-none font-mono text-xs"
              rows={7}
            />
          )}
        </div>

        {/* Import mode */}
        <fieldset className="space-y-2">
          <legend className="text-foreground text-xs font-medium">
            Import mode
          </legend>
          <div className="flex flex-col gap-2">
            {(["merge", "replace"] as const).map((mode) => (
              <label
                key={mode}
                className="flex cursor-pointer items-center gap-2"
              >
                <input
                  type="radio"
                  name="import-mode"
                  value={mode}
                  checked={importMode === mode}
                  onChange={() => setImportMode(mode)}
                  className="accent-primary"
                />
                <span className="text-sm">
                  {mode === "merge"
                    ? "Merge with existing (skip duplicate IDs)"
                    : "Replace all (overwrites current prompts and website rules)"}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* Error / preview */}
        {error && (
          <div className="bg-destructive/10 text-destructive rounded-lg px-3 py-2 text-xs">
            {error}
          </div>
        )}
        {preview && !error && (
          <div className="bg-muted/40 space-y-0.5 rounded-lg px-3 py-2 text-xs">
            <p className="text-foreground font-medium">Ready to import:</p>
            <p className="text-muted-foreground">
              {preview.promptCount} prompt{preview.promptCount !== 1 ? "s" : ""}
              {preview.siteCount > 0 &&
                `, ${preview.siteCount} website site${preview.siteCount !== 1 ? "s" : ""}`}
              {preview.appAssignmentCount > 0 &&
                `, ${preview.appAssignmentCount} app assignment${preview.appAssignmentCount !== 1 ? "s" : ""}`}
              {preview.ruleCount > 0 &&
                `, ${preview.ruleCount} rule${preview.ruleCount !== 1 ? "s" : ""}`}
            </p>
          </div>
        )}

        <DialogFooter>
          <DialogPrimitive.Close render={<Button variant="outline" />}>
            Cancel
          </DialogPrimitive.Close>
          <Button onClick={handleImport} disabled={!preview}>
            {importLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
