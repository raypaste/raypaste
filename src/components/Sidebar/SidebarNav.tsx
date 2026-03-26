import { LayoutGrid, BookOpen, SquarePen, Globe } from "lucide-react";
import { Button } from "#/components/ui/button";
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
        <Button
          key={id}
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onNavigate(id)}
          className={cn(
            "h-auto w-full justify-start gap-2 px-2 py-1.5 text-[13px] font-medium",
            activePage === id
              ? "bg-secondary text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Icon className="h-4 w-4 shrink-0" />
          <span>{label}</span>
        </Button>
      ))}
    </nav>
  );
}
