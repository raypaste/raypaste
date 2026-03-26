import { ReactNode } from "react";
import { cn } from "#/lib/utils";
import { Trash2 } from "lucide-react";

interface RuleEditorProps {
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

export function RuleEditor({
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
}: RuleEditorProps) {
  return (
    <div className="border-border bg-muted/10 rounded-xl border p-4">
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

      <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase">
              Match URL
            </label>
            <input
              type="text"
              value={inputValue}
              disabled={inputDisabled}
              onChange={(event) => onInputChange?.(event.target.value)}
              onBlur={(event) => onInputBlur?.(event.target.value)}
              placeholder={inputPlaceholder}
              className={cn(
                "border-border bg-background text-foreground w-full rounded-lg border px-3 py-2 text-sm",
                "placeholder:text-muted-foreground focus:border-ring focus:outline-none",
                inputDisabled && "bg-muted/40 text-muted-foreground",
              )}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase">
            Prompt
          </label>
          {promptCombobox}
        </div>

        <div className="space-y-1.5">
          <label className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase">
            Label
          </label>
          <input
            type="text"
            value={labelValue}
            onChange={(event) => onLabelChange(event.target.value)}
            placeholder="Optional label"
            className={cn(
              "border-border bg-background text-foreground w-full rounded-lg border px-3 py-2 text-sm",
              "placeholder:text-muted-foreground focus:border-ring focus:outline-none",
            )}
          />
        </div>
      </div>

      {footer && <div className="mt-3">{footer}</div>}
    </div>
  );
}
