import { Globe } from "lucide-react";

export function WebsitePromptsIntro() {
  return (
    <div className="from-primary/6 via-background to-primary/2 border-border rounded-xl border bg-linear-to-br p-3">
      <div className="flex items-start gap-3">
        <div className="bg-primary/12 text-primary rounded-xl p-3">
          <Globe className="h-4 w-4" />
        </div>
        <div className="space-y-2">
          <div>
            <p className="text-foreground text-sm font-medium">How it works</p>
            <p className="text-muted-foreground mt-1 max-w-3xl text-xs leading-relaxed">
              Set prompts for use on specific websites. Optionally assign
              prompts for specific pages or sections of a site.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
