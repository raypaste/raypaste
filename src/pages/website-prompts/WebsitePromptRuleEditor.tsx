import { ReactNode } from "react";
import { Trash2 } from "lucide-react";
import { Input } from "#/components/ui/input";
import { cn } from "#/lib/utils";

interface WebsitePromptRuleEditorProps {
  title: string;
  description: string;
  labelValue: string;
  onLabelChange: (value: string) => void;
  inputValue: string;
  inputPlaceholder: string;
  inputDisabled?: boolean;
  onInputChange?: (value: string) => void;
  onInputBlur?: (value: string) => void;
  promptCombobox: ReactNode;
  footer?: ReactNode;
  onDelete: () => void;
}

export function WebsitePromptRuleEditor({
  title,
  description,
  labelValue,
  onLabelChange,
  inputValue,
  inputPlaceholder,
  inputDisabled = false,
  onInputChange,
  onInputBlur,
  promptCombobox,
  footer,
  onDelete,
}: WebsitePromptRuleEditorProps) {
  return (
    <div className="border-border bg-muted/50 rounded-xl border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-foreground text-sm font-medium">{title}</p>
          <p className="text-muted-foreground mt-1 text-sm">{description}</p>
        </div>
        <button
          type="button"
          onClick={onDelete}
          className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-lg p-2 transition-colors"
          aria-label="Remove rule"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        <div className="space-y-1.5">
          <label className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase">
            Match URL
          </label>
          <Input
            type="text"
            value={inputValue}
            disabled={inputDisabled}
            onChange={(event) => onInputChange?.(event.target.value)}
            onBlur={(event) => onInputBlur?.(event.target.value)}
            placeholder={inputPlaceholder}
            className={cn(
              "border-border bg-background text-foreground w-full px-3 shadow-none",
              "placeholder:text-muted-foreground focus-visible:border-ring",
              inputDisabled && "bg-muted/40 text-muted-foreground disabled:opacity-100",
            )}
          />
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="flex min-w-0 flex-col gap-1.5">
            <label className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase">
              Prompt
            </label>
            <div className="min-h-8 w-full min-w-0 **:data-[slot=input-group]:w-full">
              {promptCombobox}
            </div>
          </div>

          <div className="flex min-w-0 flex-col gap-1.5">
            <label className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase">
              Label
            </label>
            <Input
              type="text"
              value={labelValue}
              onChange={(event) => onLabelChange(event.target.value)}
              placeholder="Optional label"
              className={cn(
                "border-border bg-background text-foreground w-full px-3 shadow-none",
                "placeholder:text-muted-foreground focus-visible:border-ring",
              )}
            />
          </div>
        </div>
      </div>

      {footer && <div className="mt-3">{footer}</div>}
    </div>
  );
}
