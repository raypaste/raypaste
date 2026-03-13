import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Search } from "lucide-react";
import { cn } from "#/lib/utils";
import { useAppsStore, usePromptsStore } from "#/stores";
import type { InstalledApp, Prompt } from "#/stores";
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from "#/components/ui/combobox";

function AppPromptCombobox({
  prompts,
  assignedPromptId,
  onAssign,
}: {
  prompts: Prompt[];
  assignedPromptId: string;
  onAssign: (promptId: string) => void;
}) {
  const [query, setQuery] = useState("");

  const filtered = query
    ? prompts.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
    : prompts;

  const selectedName =
    prompts.find((p) => p.id === assignedPromptId)?.name ?? "";

  return (
    <Combobox
      value={selectedName}
      onValueChange={(name) => {
        onAssign(prompts.find((p) => p.name === name)?.id ?? "");
      }}
      onInputValueChange={setQuery}
    >
      <ComboboxInput
        placeholder="No prompt"
        showTrigger
        showClear={!!assignedPromptId}
        className="min-w-40 max-w-64"
      />
      <ComboboxContent className="min-w-56">
        {filtered.length === 0 && (
          <ComboboxEmpty>No prompts found</ComboboxEmpty>
        )}
        <ComboboxList>
          {filtered.map((p) => (
            <ComboboxItem key={p.id} value={p.name} className="py-2 pl-3">
              {p.name}
            </ComboboxItem>
          ))}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

export function AppsPage() {
  const { apps, setApps } = useAppsStore();
  const { prompts, assignAppToPrompt, unassignApp } = usePromptsStore();
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(apps.length === 0);
  const [iconSrcByBundleId, setIconSrcByBundleId] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    if (apps.length > 0) return;
    invoke<InstalledApp[]>("list_apps")
      .then((result) => {
        setApps(result);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [apps.length, setApps]);

  useEffect(() => {
    const appsWithMissingIcons = apps.filter(
      (app) => app.iconPath && !iconSrcByBundleId[app.bundleId],
    );

    if (appsWithMissingIcons.length === 0) return;

    let cancelled = false;

    Promise.all(
      appsWithMissingIcons.map(async (app) => {
        const src = await invoke<string | null>("get_icon_base64", {
          request: { path: app.iconPath },
        });

        return src ? [app.bundleId, src] : null;
      }),
    )
      .then((results) => {
        if (cancelled) return;

        const nextEntries = results.filter(
          (entry): entry is [string, string] => entry !== null,
        );

        if (nextEntries.length === 0) return;

        setIconSrcByBundleId((current) => ({
          ...current,
          ...Object.fromEntries(nextEntries),
        }));
      })
      .catch(() => {
        // Keep the fallback placeholder if icon loading fails.
      });

    return () => {
      cancelled = true;
    };
  }, [apps, iconSrcByBundleId]);

  const filtered = apps.filter(
    (app) =>
      app.name.toLowerCase().includes(search.toLowerCase()) ||
      app.bundleId.toLowerCase().includes(search.toLowerCase()),
  );

  function getAssignedPromptId(bundleId: string): string {
    return prompts.find((p) => p.appIds.includes(bundleId))?.id ?? "";
  }

  function handleAssign(bundleId: string, promptId: string) {
    if (!promptId) {
      unassignApp(bundleId);
    } else {
      assignAppToPrompt(promptId, bundleId);
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground text-sm">Loading apps...</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-4 px-6 pb-6">
      {/* Search */}
      <div className="relative">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search apps..."
          className={cn(
            "border-border bg-muted/30 text-foreground w-full rounded-lg border py-2 pr-3 pl-9 text-sm",
            "placeholder:text-muted-foreground focus:border-ring focus:outline-none",
          )}
        />
      </div>

      {/* App list */}
      <div className="flex-1 overflow-auto">
        {filtered.length === 0 ? (
          <p className="text-muted-foreground text-sm">No apps found.</p>
        ) : (
          <div className="space-y-1">
            {filtered.map((app) => (
              <div
                key={app.bundleId}
                className="hover:bg-muted/40 flex items-center gap-3 rounded-lg px-3 py-2"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center">
                  {iconSrcByBundleId[app.bundleId] ? (
                    <img
                      src={iconSrcByBundleId[app.bundleId]}
                      alt=""
                      className="h-8 w-8 object-contain"
                    />
                  ) : (
                    <div className="bg-muted/50 h-8 w-8 rounded-lg" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-foreground truncate text-sm">{app.name}</p>
                </div>
                <AppPromptCombobox
                  prompts={prompts}
                  assignedPromptId={getAssignedPromptId(app.bundleId)}
                  onAssign={(promptId) => handleAssign(app.bundleId, promptId)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
