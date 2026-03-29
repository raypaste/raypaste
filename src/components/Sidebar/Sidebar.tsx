import { Settings } from "lucide-react";
import { Button } from "#/components/ui/button";
import { cn } from "#/lib/utils";
import { SidebarNav, type Page } from "./SidebarNav";
import { PromptsSection } from "./PromptsSection";

interface SidebarProps {
  activePage: Page;
  selectedPromptId: string | null;
  selectedWebsitePromptSiteId: string | null;
  onNavigate: (
    page: Page,
    promptId?: string,
    websitePromptSiteId?: string,
  ) => void;
}

export function Sidebar({
  activePage,
  selectedPromptId,
  selectedWebsitePromptSiteId,
  onNavigate,
}: SidebarProps) {
  return (
    <aside className="border-border bg-sidebar flex h-full min-h-0 w-[260px] shrink-0 flex-col border-r">
      {/* Header */}
      <div className="shrink-0 px-3 pt-8 pb-3 select-none" />

      {/* Nav — fixed below header; does not scroll with prompts */}
      <div className="shrink-0 px-2">
        <SidebarNav activePage={activePage} onNavigate={onNavigate} />
      </div>

      {/* Prompts — fills remaining height; internal scroll for lists */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-2 pt-2 pb-4">
        <PromptsSection
          activePage={activePage}
          selectedPromptId={selectedPromptId}
          selectedWebsitePromptSiteId={selectedWebsitePromptSiteId}
          onNavigate={onNavigate}
        />
      </div>

      {/* Settings */}
      <div className="border-border shrink-0 border-t px-2 py-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onNavigate("settings")}
          className={cn(
            "h-auto w-full justify-start gap-2 px-2 py-1.5 text-[13px] font-medium",
            activePage === "settings"
              ? "bg-secondary text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Settings className="h-4 w-4 shrink-0" />
          <span>Settings</span>
        </Button>
      </div>
    </aside>
  );
}
