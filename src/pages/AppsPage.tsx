import { useEffect, useState } from "react";
import { invoke, convertFileSrc } from "@tauri-apps/api/core";
import { Search } from "lucide-react";
import { cn } from "#/lib/utils";
import { useAppsStore, usePromptsStore } from "#/stores";
import type { InstalledApp } from "#/stores";

export function AppsPage() {
  const { apps, setApps } = useAppsStore();
  const { prompts, assignAppToPrompt, unassignApp } = usePromptsStore();
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(apps.length === 0);

  useEffect(() => {
    if (apps.length > 0) return;
    invoke<InstalledApp[]>("list_apps")
      .then((result) => {
        setApps(result);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [apps.length, setApps]);

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
                  {app.iconPath ? (
                    <img
                      src={convertFileSrc(app.iconPath)}
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
                <select
                  value={getAssignedPromptId(app.bundleId)}
                  onChange={(e) => handleAssign(app.bundleId, e.target.value)}
                  className={cn(
                    "border-border bg-card text-muted-foreground shrink-0 rounded-md border px-2 py-1 text-xs",
                    "focus:outline-none",
                  )}
                >
                  <option value="">No prompt</option>
                  {prompts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
