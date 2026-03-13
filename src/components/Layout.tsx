import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Sidebar } from "#/components/Sidebar/Sidebar";
import { TitleBar } from "#/components/TitleBar";
import { ToastContainer } from "#/components/Toast/ToastContainer";
import type { Page } from "#/components/Sidebar/SidebarNav";
import { NewPromptPage } from "#/pages/prompts/NewPromptPage";
import { PromptPage } from "#/pages/prompts/PromptPage";
import { AppsPage } from "#/pages/AppsPage";
import { HistoryPage } from "#/pages/HistoryPage";
import { SettingsPage } from "#/pages/SettingsPage";
import { usePromptsStore, useAppsStore } from "#/stores";
import type { InstalledApp } from "#/stores";
import { useAICompletionListener } from "#/hooks/useAICompletionListener";

export function Layout() {
  const [activePage, setActivePage] = useState<Page>("new-prompt");
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const { prompts } = usePromptsStore();
  const { apps, setApps } = useAppsStore();

  useEffect(() => {
    if (apps.length > 0) return;
    invoke<InstalledApp[]>("list_apps")
      .then(setApps)
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useAICompletionListener();

  function handleNavigate(page: Page, promptId?: string) {
    setActivePage(page);
    if (page === "prompt") {
      if (promptId !== undefined) {
        setSelectedPromptId(promptId);
      }
    } else {
      setSelectedPromptId(null);
    }
  }

  const selectedPromptName = selectedPromptId
    ? prompts.find((p) => p.id === selectedPromptId)?.name
    : undefined;

  return (
    <div className="relative flex h-screen w-screen overflow-hidden rounded-xl shadow-2xl">
      <TitleBar />
      <Sidebar
        activePage={activePage}
        selectedPromptId={selectedPromptId}
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
            <NewPromptPage onCreated={(id) => handleNavigate("prompt", id)} />
          )}
          {activePage === "prompt" && selectedPromptId && (
            <PromptPage
              key={selectedPromptId}
              promptId={selectedPromptId}
              onDeleted={() => handleNavigate("new-prompt")}
            />
          )}
          {activePage === "apps" && <AppsPage />}
          {activePage === "history" && <HistoryPage />}
          {activePage === "settings" && <SettingsPage />}
        </div>
      </main>
      <ToastContainer />
    </div>
  );
}

function getPageTitle(page: Page, promptName: string | undefined): string {
  if (page === "prompt" && promptName) {
    return promptName;
  }
  if (page === "new-prompt") {
    return "New Prompt";
  }

  return page.replace(/-/g, " ");
}
