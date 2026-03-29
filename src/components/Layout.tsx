import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Sidebar } from "#/components/Sidebar/Sidebar";
import { TitleBar } from "#/components/TitleBar";
import { Toaster } from "#/components/ui/sonner";
import type { Page } from "#/components/Sidebar/SidebarNav";
import { NewPromptPage } from "#/pages/prompts/NewPromptPage";
import type { NewPromptPagePrefill } from "#/pages/prompts/newPromptPageTypes";
import { PromptPage } from "#/pages/prompts/PromptPage";
import { AppsPage } from "#/pages/apps/AppsPage";
import { HistoryPage } from "#/pages/history/HistoryPage";
import { WebsitePromptsPage } from "#/pages/website-prompts/WebsitePromptsPage";
import { SettingsPage } from "#/pages/SettingsPage";
import { usePromptsStore, useAppsStore } from "#/stores";
import type { InstalledApp } from "#/stores";
import { useAICompletionListener } from "#/hooks/useAICompletionListener";

export function Layout() {
  const [activePage, setActivePage] = useState<Page>("new-prompt");
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [selectedWebsitePromptSiteId, setSelectedWebsitePromptSiteId] =
    useState<string | null>(null);
  const [newPromptPrefill, setNewPromptPrefill] =
    useState<NewPromptPagePrefill | null>(null);
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
    prefill?: NewPromptPagePrefill | null,
  ) {
    setActivePage(page);
    if (page === "prompt") {
      if (promptId !== undefined) {
        setSelectedPromptId(promptId);
      }
      setSelectedWebsitePromptSiteId(null);
      setNewPromptPrefill(null);
    } else if (page === "website-prompts") {
      setSelectedPromptId(null);
      if (websitePromptSiteId !== undefined) {
        setSelectedWebsitePromptSiteId(websitePromptSiteId);
      }
      setNewPromptPrefill(null);
    } else if (page === "new-prompt") {
      setSelectedPromptId(null);
      setSelectedWebsitePromptSiteId(null);
      setNewPromptPrefill(prefill ?? null);
    } else {
      setSelectedPromptId(null);
      setSelectedWebsitePromptSiteId(null);
      setNewPromptPrefill(null);
    }
  }

  const selectedPromptName = selectedPromptId
    ? prompts.find((p) => p.id === selectedPromptId)?.name
    : undefined;
  const newPromptPageKey = newPromptPrefill
    ? JSON.stringify(newPromptPrefill)
    : "empty";

  return (
    <>
      <div className="relative flex h-screen w-screen overflow-hidden rounded-xl shadow-2xl">
        <TitleBar />
        <Sidebar
          activePage={activePage}
          selectedPromptId={selectedPromptId}
          selectedWebsitePromptSiteId={selectedWebsitePromptSiteId}
          onNavigate={handleNavigate}
        />
        <main className="bg-background flex flex-1 flex-col overflow-hidden">
          <div className="px-6 pt-[20px] pb-4">
            <h1 className="text-foreground/80 text-base font-semibold capitalize">
              {getPageTitle(activePage, selectedPromptName)}
            </h1>
          </div>

          <div className="flex-1 overflow-auto">
            {activePage === "new-prompt" && (
              <NewPromptPage
                key={newPromptPageKey}
                prefill={newPromptPrefill}
                onCreated={(id) => handleNavigate("prompt", id)}
              />
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
                onNavigateToSettings={() => handleNavigate("settings")}
              />
            )}
            {activePage === "website-prompts" && (
              <WebsitePromptsPage
                selectedSiteId={selectedWebsitePromptSiteId}
                onSelectSite={setSelectedWebsitePromptSiteId}
                onEditPrompt={(id) => handleNavigate("prompt", id)}
                onCreatePrompt={(prefill) =>
                  handleNavigate("new-prompt", undefined, undefined, prefill)
                }
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
            {activePage === "settings" && <SettingsPage />}
          </div>
        </main>
      </div>
      <Toaster position="bottom-right" closeButton richColors />
    </>
  );
}

function getPageTitle(page: Page, promptName: string | undefined): string {
  if (page === "prompt" && promptName) {
    return promptName;
  }
  if (page === "new-prompt") {
    return "New Prompt";
  }

  if (page === "website-prompts") {
    return "Website prompts";
  }
  return page.replace(/-/g, " ");
}
