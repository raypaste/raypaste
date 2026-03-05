import { useState } from "react";
import { ChevronRight } from "lucide-react";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "#/components/ui/collapsible";
import { cn } from "#/lib/utils";

interface Prompt {
  id: string;
  name: string;
}

interface AppGroup {
  id: string;
  name: string;
  prompts: Prompt[];
}

const MOCK_APP_GROUPS: AppGroup[] = [
  {
    id: "notion",
    name: "Notion",
    prompts: [
      { id: "p1", name: "Make formal" },
      { id: "p2", name: "Summarize" },
    ],
  },
  {
    id: "vscode",
    name: "Cursor",
    prompts: [
      { id: "p3", name: "Generate metaprompt" },
      { id: "p4", name: "Update changelog" },
      { id: "p5", name: "Write tests" },
    ],
  },
  {
    id: "slack",
    name: "Slack",
    prompts: [{ id: "p6", name: "Casual tone" }],
  },
];

interface PromptsSectionProps {
  activePromptId?: string;
  onPromptSelect?: (promptId: string) => void;
}

export function PromptsSection({
  activePromptId,
  onPromptSelect,
}: PromptsSectionProps) {
  const [openGroups, setOpenGroups] = useState<Set<string>>(
    new Set(["notion"]),
  );

  const toggleGroup = (groupId: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  return (
    <div className="mt-4">
      <p className="mb-1 px-3 text-xs font-semibold tracking-wider text-neutral-400 uppercase select-none">
        Prompts
      </p>
      <div className="space-y-0.5">
        {MOCK_APP_GROUPS.map((group) => {
          const isOpen = openGroups.has(group.id);
          return (
            <Collapsible
              key={group.id}
              open={isOpen}
              onOpenChange={() => toggleGroup(group.id)}
            >
              <CollapsibleTrigger className="flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-1.5 text-sm text-neutral-200 transition-colors select-none hover:bg-neutral-800 hover:text-neutral-100">
                <ChevronRight
                  className={cn(
                    "h-3.5 w-3.5 shrink-0 transition-transform duration-150",
                    isOpen && "rotate-90",
                  )}
                />
                <span>{group.name}</span>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-0.5 space-y-0.5">
                  {group.prompts.map((prompt) => (
                    <button
                      key={prompt.id}
                      onClick={() => onPromptSelect?.(prompt.id)}
                      className={cn(
                        "w-full cursor-pointer rounded-md py-1 pr-2 pl-8 text-left text-[13px] transition-colors",
                        activePromptId === prompt.id
                          ? "bg-neutral-800 text-neutral-100"
                          : "text-neutral-200 hover:bg-neutral-800 hover:text-neutral-100",
                      )}
                    >
                      {prompt.name}
                    </button>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>
    </div>
  );
}
