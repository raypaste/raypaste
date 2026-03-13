import { useState } from "react";
import { Eye, EyeOff, Monitor, Moon, Sun } from "lucide-react";
import { LLM_PROVIDER } from "#/services/llm/types";
import { cn } from "#/lib/utils";
import { useSettingsStore } from "#/stores";
import type { ThemeMode } from "#/stores/settingsStore";

export function SettingsPage() {
  const {
    mode,
    provider,
    openrouterApiKey,
    cerebrasApiKey,
    model,
    reviewMode,
    themeMode,
    setMode,
    setProvider,
    setOpenrouterApiKey,
    setCerebrasApiKey,
    setReviewMode,
    setThemeMode,
  } = useSettingsStore();

  const [showKey, setShowKey] = useState(false);

  const currentKey =
    provider === LLM_PROVIDER.Cerebras ? cerebrasApiKey : openrouterApiKey;
  const setCurrentKey =
    provider === LLM_PROVIDER.Cerebras
      ? setCerebrasApiKey
      : setOpenrouterApiKey;

  const themeOptions: {
    value: ThemeMode;
    icon: React.ReactNode;
    label: string;
  }[] = [
    { value: "light", icon: <Sun className="size-4" />, label: "Light" },
    { value: "dark", icon: <Moon className="size-4" />, label: "Dark" },
    { value: "auto", icon: <Monitor className="size-4" />, label: "System" },
  ];

  return (
    <div className="mx-auto max-w-lg space-y-8 px-6 py-4">
      {/* Appearance */}
      <section className="space-y-3">
        <h2 className="text-foreground text-sm font-semibold">Appearance</h2>
        <div className="border-border bg-secondary rounded-lg border p-1">
          <div className="grid grid-cols-3 gap-1">
            {themeOptions.map(({ value, icon, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setThemeMode(value)}
                className={cn(
                  "flex h-8 items-center justify-center gap-1.5 rounded-md text-sm transition-colors",
                  themeMode === value
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {icon}
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* LLM Mode */}
      <section className="space-y-3">
        <h2 className="text-foreground text-sm font-semibold">LLM Mode</h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setMode("direct")}
            className={cn(
              "rounded-lg border p-4 text-left transition-colors",
              mode === "direct"
                ? "border-primary/50 bg-secondary text-foreground"
                : "border-border bg-muted/40 text-muted-foreground hover:border-border/80",
            )}
          >
            <p className="text-sm font-medium">Direct to Provider</p>
            <p className="text-muted-foreground mt-1 text-xs">
              Your API key, your usage, your data stays local/private.
            </p>
          </button>
          <div
            className={cn(
              "relative rounded-lg border p-4 text-left",
              "border-border/50 bg-muted/20 text-muted-foreground opacity-60",
            )}
          >
            <p className="text-sm font-medium">Via Raypaste</p>
            <p className="text-muted-foreground mt-1 text-xs">
              Log in with your Raypaste account, and get personalized
              self-learning AI responses.
            </p>
            <span className="bg-muted text-muted-foreground absolute top-2 right-2 rounded px-1.5 py-0.5 text-[10px]">
              Coming soon
            </span>
          </div>
        </div>
      </section>

      {/* Provider */}
      {mode === "direct" && (
        <section className="space-y-3">
          <h2 className="text-foreground text-sm font-semibold">Provider</h2>
          <div className="flex gap-2">
            {Object.values(LLM_PROVIDER).map((p) => (
              <button
                key={p}
                onClick={() => setProvider(p)}
                className={cn(
                  "rounded-md border px-4 py-2 text-sm capitalize transition-colors",
                  provider === p
                    ? "border-primary/50 bg-secondary text-foreground"
                    : "border-border text-muted-foreground hover:border-border/80 hover:text-foreground",
                )}
              >
                {p === LLM_PROVIDER.OpenRouter ? "OpenRouter" : "Cerebras"}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* API Key */}
      {mode === "direct" && (
        <section className="space-y-3">
          <h2 className="text-foreground text-sm font-semibold">
            {provider === LLM_PROVIDER.OpenRouter ? "OpenRouter" : "Cerebras"}{" "}
            API Key
          </h2>
          <div className="flex gap-2">
            <input
              type={showKey ? "text" : "password"}
              value={currentKey}
              onChange={(e) => setCurrentKey(e.target.value)}
              placeholder="sk-..."
              className={cn(
                "border-border bg-muted/30 text-foreground flex-1 rounded-lg border px-3 py-2 text-sm",
                "placeholder:text-muted-foreground focus:border-ring focus:outline-none",
              )}
            />
            <button
              onClick={() => setShowKey((v) => !v)}
              className="border-border bg-muted/30 text-muted-foreground hover:text-foreground rounded-lg border px-3 py-2 transition-colors"
            >
              {showKey ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </section>
      )}

      {/* Completion Mode */}
      <section className="space-y-3">
        <h2 className="text-foreground text-sm font-semibold">
          Completion Mode
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setReviewMode(false)}
            className={cn(
              "rounded-lg border p-4 text-left transition-colors",
              !reviewMode
                ? "border-primary/50 bg-secondary text-foreground"
                : "border-border bg-muted/40 text-muted-foreground hover:border-border/80",
            )}
          >
            <p className="text-sm font-medium">Instant</p>
            <p className="text-muted-foreground mt-1 text-xs">
              Replaces text immediately
            </p>
          </button>
          <button
            onClick={() => setReviewMode(true)}
            className={cn(
              "rounded-lg border p-4 text-left transition-colors",
              reviewMode
                ? "border-primary/50 bg-secondary text-foreground"
                : "border-border bg-muted/40 text-muted-foreground hover:border-border/80",
            )}
          >
            <p className="text-sm font-medium">Review</p>
            <p className="text-muted-foreground mt-1 text-xs">
              Preview before applying
            </p>
          </button>
        </div>
      </section>

      {/* Model */}
      <section className="space-y-3">
        <h2 className="text-foreground text-sm font-semibold">Model</h2>
        <select
          disabled
          value={model}
          className={cn(
            "border-border bg-muted/30 w-full cursor-not-allowed rounded-lg border px-3 py-2",
            "text-muted-foreground text-sm focus:outline-none",
          )}
        >
          <option value={model}>{model}</option>
        </select>
        <p className="text-muted-foreground text-xs">More models coming soon</p>
      </section>
    </div>
  );
}
