import { useState } from "react";
import { Eye, EyeOff, Monitor, Moon, Sun } from "lucide-react";
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

  const filteredPrompts = promptQuery
    ? prompts.filter((p) =>
        p.name.toLowerCase().includes(promptQuery.toLowerCase()),
      )
    : prompts;

  const filteredModelOptions = modelQuery
    ? modelOptions.filter((m) =>
        m.label.toLowerCase().includes(modelQuery.toLowerCase()),
      )
    : modelOptions;

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
                ? "border-primary bg-primary/10 text-foreground"
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
                  "cursor-pointer rounded-md border px-4 py-2 text-sm capitalize transition-colors",
                  provider === p
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground",
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
        <section className="space-y-2">
          <h2 className="text-foreground text-xs font-medium">
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
                "border-border bg-muted/30 text-foreground flex-1 rounded-lg border px-3 py-2 text-xs",
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
              "cursor-pointer rounded-lg border p-4 text-left transition-colors",
              !reviewMode
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border bg-muted/40 text-muted-foreground hover:border-primary/50 hover:text-foreground",
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
              "cursor-pointer rounded-lg border p-4 text-left transition-colors",
              reviewMode
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border bg-muted/40 text-muted-foreground hover:border-primary/50 hover:text-foreground",
            )}
          >
            <p className="text-sm font-medium">Review</p>
            <p className="text-muted-foreground mt-1 text-xs">
              Preview before applying
            </p>
          </button>
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
          onInputValueChange={(val) => setPromptQuery(val)}
        >
          <ComboboxInput
            placeholder="Select a default prompt..."
            showTrigger
            showClear={!!defaultPromptId}
            className="w-full"
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
          onInputValueChange={(val) => setModelQuery(val)}
        >
          <ComboboxInput
            placeholder="Select a model..."
            showTrigger
            className="w-full"
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
