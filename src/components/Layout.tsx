import { useState } from "react";
import { Sidebar } from "#/components/Sidebar/Sidebar";
import { TitleBar } from "#/components/TitleBar";
import type { Page } from "#/components/Sidebar/SidebarNav";
import { NewPromptPage } from "#/pages/NewPromptPage";
import { AppsPage } from "#/pages/AppsPage";
import { HistoryPage } from "#/pages/HistoryPage";

function PageContent({ page }: { page: Page }) {
  switch (page) {
    case "new-prompt":
      return <NewPromptPage />;
    case "apps":
      return <AppsPage />;
    case "history":
      return <HistoryPage />;
  }
}

export function Layout() {
  const [activePage, setActivePage] = useState<Page>("new-prompt");

  return (
    <div className="relative flex h-screen w-screen overflow-hidden rounded-xl shadow-2xl">
      <TitleBar />
      <Sidebar activePage={activePage} onNavigate={setActivePage} />
      <main className="flex flex-1 flex-col overflow-hidden bg-[#1a1a1a]">
        <div className="px-6 pt-[20px] pb-4">
          <h1 className="text-base font-semibold text-white/80 capitalize">
            {activePage.replace("-", " ")}
          </h1>
        </div>

        <div className="flex-1 overflow-auto">
          <PageContent page={activePage} />
        </div>
      </main>
    </div>
  );
}
