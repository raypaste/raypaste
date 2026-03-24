import { LayoutGrid, BookOpen, SquarePen, Globe } from "lucide-react";
import { cn } from "#/lib/utils";

export type Page =
  | "new-prompt"
  | "apps"
  | "website-prompts"
  | "history"
  | "settings"
  | "prompt";

interface NavItem {
  id: Page;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { id: "new-prompt", label: "New Prompt", icon: SquarePen },
  { id: "apps", label: "Apps", icon: LayoutGrid },
  { id: "website-prompts", label: "Website prompts", icon: Globe },
  { id: "history", label: "History", icon: BookOpen },
];

interface SidebarNavProps {
  activePage: Page;
  onNavigate: (page: Page) => void;
}

export function SidebarNav({ activePage, onNavigate }: SidebarNavProps) {
  return (
    <nav className="ml-1 space-y-0.5">
      {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onNavigate(id)}
          className={cn(
            "flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-[13px] font-medium transition-colors",
            activePage === id
              ? "bg-secondary text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Icon className="h-4 w-4 shrink-0" />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
