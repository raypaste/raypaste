import { Settings } from "lucide-react";
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
    <aside className="border-border bg-sidebar flex w-[260px] shrink-0 flex-col border-r">
      {/* Header */}
      <div className="px-3 pt-8 pb-3 select-none"></div>

      {/* Nav */}
      <div className="flex-1 space-y-4 overflow-y-auto px-2 pb-4">
        <SidebarNav activePage={activePage} onNavigate={onNavigate} />
        <PromptsSection
          activePage={activePage}
          selectedPromptId={selectedPromptId}
          selectedWebsitePromptSiteId={selectedWebsitePromptSiteId}
          onNavigate={onNavigate}
        />
      </div>

      {/* Settings */}
      <div className="border-border border-t px-2 py-2">
        <button
          onClick={() => onNavigate("settings")}
          className={cn(
            "flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-[13px] font-medium transition-colors",
            activePage === "settings"
              ? "bg-secondary text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Settings className="h-4 w-4 shrink-0" />
          <span>Settings</span>
        </button>
      </div>
    </aside>
  );
}
