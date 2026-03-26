import { Plus } from "lucide-react";
import { cn } from "#/lib/utils";
import { Button } from "#/components/ui/button";

interface WebsitePromptsToolbarProps {
  hasPrompts: boolean;
  onAddWebsite: () => void;
}

export function WebsitePromptsToolbar({
  hasPrompts,
  onAddWebsite,
}: WebsitePromptsToolbarProps) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div>
        <p className="text-foreground text-sm font-semibold">
          Your website prompt connections
        </p>
        <p className="text-muted-foreground text-xs">
          Select or add a website, then set the prompts that will be used for
          it.
        </p>
      </div>

      <Button
        type="button"
        disabled={!hasPrompts}
        onClick={onAddWebsite}
        className={cn(
          hasPrompts
            ? ""
            : "bg-muted/50 text-muted-foreground cursor-not-allowed",
        )}
      >
        <Plus className="h-4 w-4" />
        Add website
      </Button>
    </div>
  );
}
