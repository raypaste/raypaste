import { useState } from "react";
import { ChevronRight, Eye, EyeOff, Monitor, Moon, Sun } from "lucide-react";
import { ImportExportSection } from "./settings/ImportExportSection";
import { useAppIcons } from "#/hooks/useAppIcons";
import {
  filterComboboxItems,
  useComboboxSearchDirty,
} from "#/hooks/useComboboxSearchDirty";
import { cn } from "#/lib/utils";
import { LLM_PROVIDER } from "#/services/llm/types";
import { useAppsStore, usePromptsStore, useSettingsStore } from "#/stores";
import type { ThemeMode } from "#/stores/settingsStore";
import { Button } from "#/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "#/components/ui/collapsible";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "#/components/ui/combobox";
import {
  SETTINGS_NAV_ITEMS,
  type SettingsSubpage,
} from "./settings/settingsNavigation";

interface SettingsPageProps {
  activeSubpage: SettingsSubpage;
}

const modelOptions = [
  { value: "openai/gpt-oss-120b", label: "GPT OSS 120B" },
  {
    value: "meta-llama/llama-3.1-8b-instruct",
    label: "Llama 3.1 8B Instruct",
  },
];

export function SettingsPage({ activeSubpage }: SettingsPageProps) {
  const currentSection = SETTINGS_NAV_ITEMS.find(
    (item) => item.id === activeSubpage,
  );

  return (
    <div className="mx-auto max-w-lg space-y-6 px-6 py-4 pb-12">
      <header>
        <h2 className="text-foreground text-xl font-semibold">
          {currentSection?.label ?? "Settings"}
        </h2>
      </header>

      {activeSubpage === "general" && <GeneralSettingsSection />}
      {activeSubpage === "ai" && <AISettingsSection />}
      {activeSubpage === "data-apps" && <DataAndAppsSettingsSection />}
    </div>
  );
}

function GeneralSettingsSection() {
  const { reviewMode, themeMode, setReviewMode, setThemeMode } =
    useSettingsStore();
  const { prompts, defaultPromptId, setDefaultPrompt } = usePromptsStore();

  const [promptQuery, setPromptQuery] = useState("");
  const promptSearch = useComboboxSearchDirty();

  const filteredPrompts = filterComboboxItems(
    prompts,
    promptQuery,
    promptSearch.searchDirty,
    (p) => p.name,
  );

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
    <>
      <section className="space-y-3">
        <h3 className="text-foreground text-sm font-semibold">Appearance</h3>
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
                    ? [
                        "bg-background text-foreground hover:bg-background shadow-sm",
                        "dark:border-border dark:bg-input dark:text-foreground dark:hover:bg-input/90 dark:hover:text-foreground dark:shadow-md",
                      ]
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

      <section className="space-y-3">
        <h3 className="text-foreground text-sm font-semibold">
          Completion Mode
        </h3>
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

      <section className="space-y-3">
        <h3 className="text-foreground text-sm font-semibold">
          Default Prompt
        </h3>
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
              {filteredPrompts.map((prompt) => (
                <ComboboxItem
                  key={prompt.id}
                  value={prompt.name}
                  className="py-2 pl-3"
                >
                  {prompt.name}
                </ComboboxItem>
              ))}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
        <p className="text-muted-foreground text-xs">
          Used when no website prompt or app-specific prompt applies
        </p>
      </section>
    </>
  );
}

function AISettingsSection() {
  const {
    mode,
    provider,
    openrouterApiKey,
    cerebrasApiKey,
    model,
    setMode,
    setProvider,
    setOpenrouterApiKey,
    setCerebrasApiKey,
    setModel,
  } = useSettingsStore();

  const [showKey, setShowKey] = useState(false);
  const [modelQuery, setModelQuery] = useState("");
  const modelSearch = useComboboxSearchDirty();

  const filteredModelOptions = filterComboboxItems(
    modelOptions,
    modelQuery,
    modelSearch.searchDirty,
    (m) => m.label,
  );

  const modelLabelForId = (id: string) =>
    modelOptions.find((option) => option.value === id)?.label ?? id;

  const currentKey =
    provider === LLM_PROVIDER.Cerebras ? cerebrasApiKey : openrouterApiKey;
  const setCurrentKey =
    provider === LLM_PROVIDER.Cerebras
      ? setCerebrasApiKey
      : setOpenrouterApiKey;

  return (
    <>
      <section className="space-y-3">
        <h3 className="text-foreground text-sm font-semibold">AI Source</h3>
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

      {mode === "direct" && (
        <section className="space-y-3">
          <h3 className="text-foreground text-sm font-semibold">Provider</h3>
          <div className="flex gap-2">
            {Object.values(LLM_PROVIDER).map((candidateProvider) => (
              <Button
                key={candidateProvider}
                type="button"
                variant="outline"
                onClick={() => setProvider(candidateProvider)}
                className={cn(
                  "capitalize",
                  provider === candidateProvider
                    ? "border-primary bg-primary/10 text-foreground hover:bg-primary/15 active:bg-primary/20 dark:border-primary/50 dark:bg-primary/20 dark:hover:bg-primary/25 dark:active:bg-primary/30"
                    : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground dark:hover:bg-input/40",
                )}
              >
                {candidateProvider === LLM_PROVIDER.OpenRouter
                  ? "OpenRouter"
                  : "Cerebras"}
              </Button>
            ))}
          </div>
        </section>
      )}

      {mode === "direct" && (
        <section className="space-y-2">
          <h3 className="text-foreground text-xs font-medium">
            {provider === LLM_PROVIDER.OpenRouter ? "OpenRouter" : "Cerebras"}{" "}
            API Key
          </h3>
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
              onClick={() => setShowKey((value) => !value)}
              className="border-border bg-muted/30 text-muted-foreground hover:text-foreground dark:hover:bg-input/45 dark:active:bg-input/55 h-full w-10 shrink-0"
            >
              {showKey ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
          {provider === LLM_PROVIDER.Cerebras ? (
            <p className="text-muted-foreground text-xs">
              Free-tier Cerebras API keys have limited access to GPT OSS 120B;
              use Llama 3.1 8B or a paid tier to access that model.
            </p>
          ) : null}
        </section>
      )}

      <section className="space-y-3">
        <h3 className="text-foreground text-sm font-semibold">Model</h3>
        <Combobox
          value={model}
          itemToStringLabel={modelLabelForId}
          onValueChange={(id) => {
            if (id != null && id !== "") setModel(id);
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
              {filteredModelOptions.map((option) => (
                <ComboboxItem
                  key={option.value}
                  value={option.value}
                  className="py-2 pl-3"
                >
                  {option.label}
                </ComboboxItem>
              ))}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </section>
    </>
  );
}

function DataAndAppsSettingsSection() {
  const { apps, hiddenAppBundleIds, unhideApp } = useAppsStore();
  const [hiddenAppsOpen, setHiddenAppsOpen] = useState(false);

  const hiddenApps = apps.filter((app) =>
    hiddenAppBundleIds.includes(app.bundleId),
  );
  const hiddenAppIcons = useAppIcons(hiddenApps);

  return (
    <>
      <ImportExportSection />

      <section className="space-y-3">
        <Collapsible open={hiddenAppsOpen} onOpenChange={setHiddenAppsOpen}>
          <div className="border-border/70 bg-card/30 rounded-xl border">
            <CollapsibleTrigger className="flex w-full items-center gap-3 px-4 py-3 text-left">
              <ChevronRight
                className={cn(
                  "text-muted-foreground h-4 w-4 shrink-0 transition-transform",
                  hiddenAppsOpen && "rotate-90",
                )}
              />
              <div className="min-w-0 flex-1">
                <h3 className="text-foreground text-sm font-semibold">
                  Hidden Apps
                </h3>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  {hiddenApps.length > 0
                    ? `${hiddenApps.length} app${hiddenApps.length === 1 ? "" : "s"} hidden from the Apps page`
                    : "No hidden apps"}
                </p>
              </div>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <div className="border-border/60 border-t px-4 py-3">
                {hiddenApps.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    Hidden apps will appear here.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {hiddenApps.map((app) => (
                      <div
                        key={app.bundleId}
                        className="bg-muted/20 flex items-center gap-3 rounded-lg border px-3 py-2"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/70 shadow-sm ring-1 ring-black/5 dark:bg-white/5 dark:ring-white/10">
                          {hiddenAppIcons[app.bundleId] ? (
                            <img
                              src={hiddenAppIcons[app.bundleId]}
                              alt=""
                              className="h-7 w-7 object-contain"
                            />
                          ) : (
                            <div className="bg-muted/50 h-7 w-7 rounded-md" />
                          )}
                        </div>
                        <p className="text-foreground min-w-0 flex-1 truncate text-sm font-medium">
                          {app.name}
                        </p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="ml-auto"
                          onClick={() => unhideApp(app.bundleId)}
                        >
                          Unhide
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      </section>
    </>
  );
}
