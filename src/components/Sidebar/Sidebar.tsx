import { Settings } from "lucide-react";
import { Button } from "#/components/ui/button";
import { cn } from "#/lib/utils";
import { PromptsSection } from "./PromptsSection";
import { SidebarNav, type Page } from "./SidebarNav";
import {
  DEFAULT_SETTINGS_SUBPAGE,
  SETTINGS_NAV_ITEMS,
  type SettingsSubpage,
} from "#/pages/settings/settingsNavigation";

interface SidebarProps {
  activePage: Page;
  activeSettingsSubpage: SettingsSubpage;
  selectedPromptId: string | null;
  selectedWebsitePromptSiteId: string | null;
  onNavigate: (
    page: Page,
    promptId?: string,
    websitePromptSiteId?: string,
    settingsSubpage?: SettingsSubpage,
  ) => void;
}

export function Sidebar({
  activePage,
  activeSettingsSubpage,
  selectedPromptId,
  selectedWebsitePromptSiteId,
  onNavigate,
}: SidebarProps) {
  const isSettingsPage = activePage === "settings";

  return (
    <aside className="border-border bg-sidebar flex h-full min-h-0 w-[260px] shrink-0 flex-col border-r">
      <div className="shrink-0 px-3 pt-7 pb-3 select-none" />

      <div className="shrink-0 px-2">
        <SidebarNav activePage={activePage} onNavigate={onNavigate} />
      </div>

      {isSettingsPage ? (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-2 pt-3 pb-2">
          <div className="shrink-0">
            <SettingsSidebarNav
              activeSubpage={activeSettingsSubpage}
              onNavigate={(subpage) =>
                onNavigate("settings", undefined, undefined, subpage)
              }
            />
          </div>
          <div className="flex min-h-0 flex-1 flex-col pt-3">
            <PromptsSection
              activePage={activePage}
              selectedPromptId={selectedPromptId}
              selectedWebsitePromptSiteId={selectedWebsitePromptSiteId}
              onNavigate={onNavigate}
              compact
            />
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-2 pt-3 pb-2">
          <PromptsSection
            activePage={activePage}
            selectedPromptId={selectedPromptId}
            selectedWebsitePromptSiteId={selectedWebsitePromptSiteId}
            onNavigate={onNavigate}
          />
        </div>
      )}

      <div className="border-border shrink-0 border-t px-2 py-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() =>
            onNavigate(
              "settings",
              undefined,
              undefined,
              DEFAULT_SETTINGS_SUBPAGE,
            )
          }
          className={cn(
            "h-auto w-full justify-start gap-2 px-2 py-1.5 text-[13px] font-medium",
            isSettingsPage
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

interface SettingsSidebarNavProps {
  activeSubpage: SettingsSubpage;
  onNavigate: (subpage: SettingsSubpage) => void;
}

function SettingsSidebarNav({
  activeSubpage,
  onNavigate,
}: SettingsSidebarNavProps) {
  return (
    <nav
      aria-label="Settings sections"
      className="border-border/60 bg-background/50 rounded-xl border p-2"
    >
      <p className="text-muted-foreground px-2 pb-2 text-[11px] font-semibold tracking-wider uppercase">
        Settings
      </p>
      <div className="space-y-1">
        {SETTINGS_NAV_ITEMS.map((item) => (
          <Button
            key={item.id}
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onNavigate(item.id)}
            className={cn(
              "h-auto w-full items-start justify-start px-2 py-2 text-left",
              activeSubpage === item.id
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <span className="truncate text-[13px] font-medium">
              {item.label}
            </span>
          </Button>
        ))}
      </div>
    </nav>
  );
}
