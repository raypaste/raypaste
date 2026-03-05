import { SidebarNav, type Page } from "./SidebarNav";
import { PromptsSection } from "./PromptsSection";

interface SidebarProps {
  activePage: Page;
  onNavigate: (page: Page) => void;
}

export function Sidebar({ activePage, onNavigate }: SidebarProps) {
  return (
    <aside className="flex w-[260px] shrink-0 flex-col border-r border-white/6 bg-[#141414]">
      {/* Header */}
      <div className="px-3 pt-8 pb-3 select-none"></div>

      {/* Nav */}
      <div className="flex-1 space-y-4 overflow-y-auto px-2 pb-4">
        <SidebarNav activePage={activePage} onNavigate={onNavigate} />
        <PromptsSection />
      </div>
    </aside>
  );
}
