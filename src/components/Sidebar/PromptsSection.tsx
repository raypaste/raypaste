import { useState } from "react";
import { ChevronRight, Star } from "lucide-react";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "#/components/ui/collapsible";
import { cn } from "#/lib/utils";
import { usePromptsStore, useAppsStore } from "#/stores";
import type { Page } from "./SidebarNav";

interface PromptsSectionProps {
  selectedPromptId: string | null;
  onNavigate: (page: Page, promptId?: string) => void;
}

export function PromptsSection({
  selectedPromptId,
  onNavigate,
}: PromptsSectionProps) {
  const { prompts, defaultPromptId } = usePromptsStore();
  const { apps } = useAppsStore();

  // App groups: prompts assigned to specific apps
  const appGroups = apps
    .map((app) => {
      const assignedPrompts = prompts.filter((p) =>
        p.appIds.includes(app.bundleId),
      );
      return { app, prompts: assignedPrompts };
    })
    .filter((g) => g.prompts.length > 0);

  const [openGroups, setOpenGroups] = useState<Set<string> | null>(null);
  const resolvedOpenGroups =
    openGroups ?? new Set(appGroups.slice(0, 5).map((g) => g.app.bundleId));

  function toggleGroup(groupId: string) {
    setOpenGroups((prev) => {
      const next = new Set(
        prev ?? appGroups.slice(0, 5).map((g) => g.app.bundleId),
      );
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  }

  // Ungrouped: prompts with no app assignments
  const ungroupedPrompts = prompts.filter((p) => p.appIds.length === 0);

  if (prompts.length === 0) return null;

  function PromptItem({ id, name }: { id: string; name: string }) {
    const isSelected = selectedPromptId === id;
    const isDefault = defaultPromptId === id;
    return (
      <button
        onClick={() => onNavigate("prompt", id)}
        className={cn(
          "flex w-full cursor-pointer items-center gap-1.5 rounded-md py-1 pr-2 pl-8 text-left text-[13px] transition-colors",
          isSelected
            ? "bg-neutral-800 text-neutral-100"
            : "text-neutral-300 hover:bg-neutral-800 hover:text-neutral-100",
        )}
      >
        <span className="flex-1 truncate">{name}</span>
        {isDefault && (
          <Star className="h-3 w-3 shrink-0 fill-green-400 text-green-400" />
        )}
      </button>
    );
  }

  return (
    <div className="mt-4">
      <p className="mb-1 px-3 text-xs font-semibold tracking-wider text-neutral-400 uppercase select-none">
        Prompts
      </p>
      <div className="space-y-0.5">
        {/* App groups */}
        {appGroups.map(({ app, prompts: groupPrompts }) => {
          const isOpen = resolvedOpenGroups.has(app.bundleId);
          return (
            <Collapsible
              key={app.bundleId}
              open={isOpen}
              onOpenChange={() => toggleGroup(app.bundleId)}
            >
              <CollapsibleTrigger className="flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-1.5 text-sm text-neutral-200 transition-colors select-none hover:bg-neutral-800 hover:text-neutral-100">
                <ChevronRight
                  className={cn(
                    "h-3.5 w-3.5 shrink-0 transition-transform duration-150",
                    isOpen && "rotate-90",
                  )}
                />
                <span className="truncate">{app.name}</span>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-0.5 space-y-0.5">
                  {groupPrompts.map((prompt) => (
                    <PromptItem
                      key={prompt.id}
                      id={prompt.id}
                      name={prompt.name}
                    />
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}

        {/* Ungrouped prompts */}
        {ungroupedPrompts.length > 0 && (
          <Collapsible
            open={resolvedOpenGroups.has("__ungrouped__")}
            onOpenChange={() => toggleGroup("__ungrouped__")}
          >
            <CollapsibleTrigger className="flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-1.5 text-sm text-neutral-200 transition-colors select-none hover:bg-neutral-800 hover:text-neutral-100">
              <ChevronRight
                className={cn(
                  "h-3.5 w-3.5 shrink-0 transition-transform duration-150",
                  resolvedOpenGroups.has("__ungrouped__") && "rotate-90",
                )}
              />
              <span>Ungrouped</span>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-0.5 space-y-0.5">
                {ungroupedPrompts.map((prompt) => (
                  <PromptItem
                    key={prompt.id}
                    id={prompt.id}
                    name={prompt.name}
                  />
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
    </div>
  );
}
