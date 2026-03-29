import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Sidebar } from "#/components/Sidebar/Sidebar";
import type { Page } from "#/components/Sidebar/SidebarNav";
import { TitleBar } from "#/components/TitleBar";
import { Toaster } from "#/components/ui/sonner";
import { useAICompletionListener } from "#/hooks/useAICompletionListener";
import { SettingsPage } from "#/pages/SettingsPage";
import { AppsPage } from "#/pages/apps/AppsPage";
import { HistoryPage } from "#/pages/history/HistoryPage";
import { NewPromptPage } from "#/pages/prompts/NewPromptPage";
import { PromptPage } from "#/pages/prompts/PromptPage";
import {
  DEFAULT_SETTINGS_SUBPAGE,
  getSettingsSubpageLabel,
  type SettingsSubpage,
} from "#/pages/settings/settingsNavigation";
import { WebsitePromptsPage } from "#/pages/website-prompts/WebsitePromptsPage";
import { useAppsStore, usePromptsStore } from "#/stores";
import type { InstalledApp } from "#/stores";

export function Layout() {
  const [activePage, setActivePage] = useState<Page>("new-prompt");
  const [activeSettingsSubpage, setActiveSettingsSubpage] =
    useState<SettingsSubpage>(DEFAULT_SETTINGS_SUBPAGE);
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [selectedWebsitePromptSiteId, setSelectedWebsitePromptSiteId] =
    useState<string | null>(null);
  const { prompts } = usePromptsStore();
  const { apps, setApps } = useAppsStore();

  useEffect(() => {
    if (apps.length > 0) {
      return;
    }
    invoke<InstalledApp[]>("list_apps")
      .then(setApps)
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useAICompletionListener();

  function handleNavigate(
    page: Page,
    promptId?: string,
    websitePromptSiteId?: string,
    settingsSubpage?: SettingsSubpage,
  ) {
    setActivePage(page);
    if (page === "settings") {
      setActiveSettingsSubpage(settingsSubpage ?? DEFAULT_SETTINGS_SUBPAGE);
    }

    if (page === "prompt") {
      if (promptId !== undefined) {
        setSelectedPromptId(promptId);
      }
      setSelectedWebsitePromptSiteId(null);
    } else if (page === "website-prompts") {
      setSelectedPromptId(null);
      if (websitePromptSiteId !== undefined) {
        setSelectedWebsitePromptSiteId(websitePromptSiteId);
      }
    } else {
      setSelectedPromptId(null);
      setSelectedWebsitePromptSiteId(null);
    }
  }

  const selectedPromptName = selectedPromptId
    ? prompts.find((prompt) => prompt.id === selectedPromptId)?.name
    : undefined;

  return (
    <>
      <div className="relative flex h-screen w-screen overflow-hidden rounded-xl shadow-2xl">
        <TitleBar />
        <Sidebar
          activePage={activePage}
          activeSettingsSubpage={activeSettingsSubpage}
          selectedPromptId={selectedPromptId}
          selectedWebsitePromptSiteId={selectedWebsitePromptSiteId}
          onNavigate={handleNavigate}
        />
        <main className="bg-background flex flex-1 flex-col overflow-hidden">
          <div className="px-6 pt-[20px] pb-4">
            <h1 className="text-foreground/80 text-base font-semibold capitalize">
              {getPageTitle(
                activePage,
                selectedPromptName,
                activeSettingsSubpage,
              )}
            </h1>
          </div>

          <div className="flex-1 overflow-auto">
            {activePage === "new-prompt" && (
              <NewPromptPage onCreated={(id) => handleNavigate("prompt", id)} />
            )}
            {activePage === "prompt" && selectedPromptId && (
              <PromptPage
                key={selectedPromptId}
                promptId={selectedPromptId}
                onDeleted={() => handleNavigate("new-prompt")}
                onNavigateToWebsitePromptSite={(siteId) =>
                  handleNavigate("website-prompts", undefined, siteId)
                }
              />
            )}
            {activePage === "apps" && (
              <AppsPage
                onNavigateToSettings={() =>
                  handleNavigate(
                    "settings",
                    undefined,
                    undefined,
                    DEFAULT_SETTINGS_SUBPAGE,
                  )
                }
              />
            )}
            {activePage === "website-prompts" && (
              <WebsitePromptsPage
                selectedSiteId={selectedWebsitePromptSiteId}
                onSelectSite={setSelectedWebsitePromptSiteId}
                onEditPrompt={(id) => handleNavigate("prompt", id)}
              />
            )}
            {activePage === "history" && (
              <HistoryPage
                onNavigateToPrompt={(id) => handleNavigate("prompt", id)}
                onNavigateToWebsiteSite={(siteId) =>
                  handleNavigate("website-prompts", undefined, siteId)
                }
              />
            )}
            {activePage === "settings" && (
              <SettingsPage activeSubpage={activeSettingsSubpage} />
            )}
          </div>
        </main>
      </div>
      <Toaster position="bottom-right" closeButton richColors />
    </>
  );
}

function getPageTitle(
  page: Page,
  promptName: string | undefined,
  settingsSubpage: SettingsSubpage,
): string {
  if (page === "prompt" && promptName) {
    return promptName;
  }
  if (page === "new-prompt") {
    return "New Prompt";
  }
  if (page === "website-prompts") {
    return "Website prompts";
  }
  if (page === "settings") {
    return getSettingsSubpageLabel(settingsSubpage);
  }

  return page.replace(/-/g, " ");
}
