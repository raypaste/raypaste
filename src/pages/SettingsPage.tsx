import { useState } from "react";
import { Eye, EyeOff, Monitor, Moon, Sun } from "lucide-react";
import {
  filterComboboxItems,
  useComboboxSearchDirty,
} from "#/hooks/useComboboxSearchDirty";
import { LLM_PROVIDER } from "#/services/llm/types";
import { cn } from "#/lib/utils";
import { useSettingsStore, usePromptsStore } from "#/stores";
import type { ThemeMode } from "#/stores/settingsStore";
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from "#/components/ui/combobox";
import { Button } from "#/components/ui/button";

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
    setModel,
    setReviewMode,
    setThemeMode,
  } = useSettingsStore();

  const modelOptions = [
    { value: "openai/gpt-oss-120b", label: "GPT OSS 120B" },
    {
      value: "meta-llama/llama-3.1-8b-instruct",
      label: "Llama 3.1 8B Instruct",
    },
  ];

  const { prompts, defaultPromptId, setDefaultPrompt } = usePromptsStore();

  const [showKey, setShowKey] = useState(false);
  const [promptQuery, setPromptQuery] = useState("");
  const [modelQuery, setModelQuery] = useState("");
  const promptSearch = useComboboxSearchDirty();
  const modelSearch = useComboboxSearchDirty();

  const filteredPrompts = filterComboboxItems(
    prompts,
    promptQuery,
    promptSearch.searchDirty,
    (p) => p.name,
  );

  const filteredModelOptions = filterComboboxItems(
    modelOptions,
    modelQuery,
    modelSearch.searchDirty,
    (m) => m.label,
  );

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
    <div className="mx-auto max-w-lg space-y-8 px-6 py-4 pb-12">
      {/* Appearance */}
      <section className="space-y-3">
        <h2 className="text-foreground text-sm font-semibold">Appearance</h2>
        <div className="border-border bg-secondary rounded-lg border p-1">
          <div className="grid grid-cols-3 gap-1">
            {themeOptions.map(({ value, icon, label }) => (
              <Button
                key={value}
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setThemeMode(value)}
                className={cn(
                  "h-8 flex-1 gap-1.5 font-normal",
                  themeMode === value
                    ? "bg-background text-foreground shadow-sm hover:bg-background dark:bg-muted dark:text-foreground dark:shadow-none dark:ring-1 dark:ring-border/80 dark:hover:bg-muted"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {icon}
                <span>{label}</span>
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* AI Source */}
      <section className="space-y-3">
        <h2 className="text-foreground text-sm font-semibold">AI Source</h2>
        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => setMode("direct")}
            className={cn(
              "h-auto min-h-0 w-full min-w-0 shrink flex-col items-stretch rounded-lg p-4 text-left font-normal whitespace-normal",
              mode === "direct"
                ? "border-primary bg-primary/10 text-foreground hover:bg-primary/15 active:bg-primary/20 dark:border-primary/50 dark:bg-primary/20 dark:hover:bg-primary/25 dark:active:bg-primary/30"
                : "border-border bg-muted/40 text-muted-foreground hover:border-border/80 hover:bg-muted/40 dark:bg-muted/60 dark:hover:bg-muted/60",
            )}
          >
            <p className="text-sm font-medium">Direct to Provider</p>
            <p className="text-muted-foreground mt-1 text-xs">
              Your API key, your usage, your data stays local/private.
            </p>
          </Button>
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
              <Button
                key={p}
                type="button"
                variant="outline"
                onClick={() => setProvider(p)}
                className={cn(
                  "capitalize",
                  provider === p
                    ? "border-primary bg-primary/10 text-foreground hover:bg-primary/15 active:bg-primary/20 dark:border-primary/50 dark:bg-primary/20 dark:hover:bg-primary/25 dark:active:bg-primary/30"
                    : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground dark:hover:bg-input/40",
                )}
              >
                {p === LLM_PROVIDER.OpenRouter ? "OpenRouter" : "Cerebras"}
              </Button>
            ))}
          </div>
        </section>
      )}

      {/* API Key */}
      {mode === "direct" && (
        <section className="space-y-2">
          <h2 className="text-foreground text-xs font-medium">
            {provider === LLM_PROVIDER.OpenRouter ? "OpenRouter" : "Cerebras"}{" "}
            API Key
          </h2>
          <div className="flex h-8 gap-2">
            <input
              type={showKey ? "text" : "password"}
              value={currentKey}
              onChange={(e) => setCurrentKey(e.target.value)}
              placeholder="sk-..."
              className={cn(
                "border-border bg-muted/30 text-foreground h-full flex-1 rounded-lg border px-3 py-2 text-xs",
                "placeholder:text-muted-foreground focus:border-ring focus:outline-none",
              )}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowKey((v) => !v)}
              className="border-border bg-muted/30 text-muted-foreground hover:text-foreground dark:hover:bg-input/45 dark:active:bg-input/55 h-full w-10 shrink-0"
            >
              {showKey ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
        </section>
      )}

      {/* Completion Mode */}
      <section className="space-y-3">
        <h2 className="text-foreground text-sm font-semibold">
          Completion Mode
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => setReviewMode(false)}
            className={cn(
              "h-auto min-h-0 w-full min-w-0 shrink flex-col items-stretch rounded-lg p-4 text-left font-normal whitespace-normal",
              !reviewMode
                ? "border-primary bg-primary/10 text-foreground hover:bg-primary/15 active:bg-primary/20 dark:border-primary/50 dark:bg-primary/20 dark:hover:bg-primary/25 dark:active:bg-primary/30"
                : "border-border bg-muted/40 text-muted-foreground hover:border-primary/50 hover:bg-muted/40 hover:text-foreground dark:bg-muted/60 dark:hover:bg-muted/60",
            )}
          >
            <p className="text-sm font-medium">Instant</p>
            <p className="text-muted-foreground mt-1 text-xs">
              Replaces text immediately
            </p>
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setReviewMode(true)}
            className={cn(
              "h-auto min-h-0 w-full min-w-0 shrink flex-col items-stretch rounded-lg p-4 text-left font-normal whitespace-normal",
              reviewMode
                ? "border-primary bg-primary/10 text-foreground hover:bg-primary/15 active:bg-primary/20 dark:border-primary/50 dark:bg-primary/20 dark:hover:bg-primary/25 dark:active:bg-primary/30"
                : "border-border bg-muted/40 text-muted-foreground hover:border-primary/50 hover:bg-muted/40 hover:text-foreground dark:bg-muted/60 dark:hover:bg-muted/60",
            )}
          >
            <p className="text-sm font-medium">Review</p>
            <p className="text-muted-foreground mt-1 text-xs">
              Preview before applying
            </p>
          </Button>
        </div>
      </section>

      {/* Default Prompt */}
      <section className="space-y-3">
        <h2 className="text-foreground text-sm font-semibold">
          Default Prompt
        </h2>
        <Combobox
          value={prompts.find((p) => p.id === defaultPromptId)?.name ?? ""}
          onValueChange={(name) =>
            setDefaultPrompt(prompts.find((p) => p.name === name)?.id ?? null)
          }
          onOpenChange={promptSearch.onOpenChange}
          onInputValueChange={(val) => setPromptQuery(val)}
        >
          <ComboboxInput
            placeholder="Select a default prompt..."
            showTrigger
            showClear={!!defaultPromptId}
            className="w-full"
            onInput={promptSearch.markSearchDirtyFromInput}
          />
          <ComboboxContent>
            {filteredPrompts.length === 0 && (
              <ComboboxEmpty>No prompts found</ComboboxEmpty>
            )}
            <ComboboxList>
              {filteredPrompts.map((p) => (
                <ComboboxItem key={p.id} value={p.name} className="py-2 pl-3">
                  {p.name}
                </ComboboxItem>
              ))}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
        <p className="text-muted-foreground text-xs">
          Used when no website prompt or app-specific prompt applies
        </p>
      </section>

      {/* Model */}
      <section className="space-y-3">
        <h2 className="text-foreground text-sm font-semibold">Model</h2>
        <Combobox
          value={modelOptions.find((m) => m.value === model)?.label ?? model}
          onValueChange={(label) => {
            if (label)
              setModel(
                modelOptions.find((m) => m.label === label)?.value ?? label,
              );
          }}
          onOpenChange={modelSearch.onOpenChange}
          onInputValueChange={(val) => setModelQuery(val)}
        >
          <ComboboxInput
            placeholder="Select a model..."
            showTrigger
            className="w-full"
            onInput={modelSearch.markSearchDirtyFromInput}
          />
          <ComboboxContent>
            {filteredModelOptions.length === 0 && (
              <ComboboxEmpty>No models found</ComboboxEmpty>
            )}
            <ComboboxList>
              {filteredModelOptions.map((m) => (
                <ComboboxItem
                  key={m.value}
                  value={m.label}
                  className="py-2 pl-3"
                >
                  {m.label}
                </ComboboxItem>
              ))}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </section>
    </div>
  );
}
