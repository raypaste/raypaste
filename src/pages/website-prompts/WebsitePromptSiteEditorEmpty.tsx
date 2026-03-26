import { Globe } from "lucide-react";

export function WebsitePromptSiteEditorEmpty() {
  return (
    <div className="flex h-full min-h-60 flex-col items-center justify-center text-center">
      <Globe className="text-muted-foreground mb-3 h-6 w-6" />
      <p className="text-foreground font-medium">Select a website card</p>
      <p className="text-muted-foreground mt-1 max-w-md text-sm leading-relaxed">
        Choose a website from the list to edit its domain, favicon, and nested
        matching rules.
      </p>
    </div>
  );
}
