import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { LLM_PROVIDER } from "#/services/llm/types";
import { cn } from "#/lib/utils";
import { useSettingsStore } from "#/stores";

export function SettingsPage() {
  const {
    mode,
    provider,
    openrouterApiKey,
    cerebrasApiKey,
    model,
    reviewMode,
    setMode,
    setProvider,
    setOpenrouterApiKey,
    setCerebrasApiKey,
    setReviewMode,
  } = useSettingsStore();

  const [showKey, setShowKey] = useState(false);

  const currentKey =
    provider === LLM_PROVIDER.Cerebras ? cerebrasApiKey : openrouterApiKey;
  const setCurrentKey =
    provider === LLM_PROVIDER.Cerebras
      ? setCerebrasApiKey
      : setOpenrouterApiKey;

  return (
    <div className="mx-auto max-w-lg space-y-8 px-6 py-4">
      {/* LLM Mode */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-neutral-300">LLM Mode</h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setMode("direct")}
            className={cn(
              "rounded-lg border p-4 text-left transition-colors",
              mode === "direct"
                ? "border-neutral-500 bg-neutral-800 text-neutral-100"
                : "border-white/8 bg-white/4 text-neutral-400 hover:border-white/15",
            )}
          >
            <p className="text-sm font-medium">Direct to Provider</p>
            <p className="mt-1 text-xs text-neutral-500">
              Your API key, your usage, your data stays local/private.
            </p>
          </button>
          <div
            className={cn(
              "relative rounded-lg border p-4 text-left",
              "border-white/6 bg-white/3 text-neutral-600 opacity-60",
            )}
          >
            <p className="text-sm font-medium">Via Raypaste</p>
            <p className="mt-1 text-xs text-neutral-600">
              Log in with your Raypaste account, and get personalized
              self-learning AI responses.
            </p>
            <span className="absolute top-2 right-2 rounded bg-neutral-700 px-1.5 py-0.5 text-[10px] text-neutral-400">
              Coming soon
            </span>
          </div>
        </div>
      </section>

      {/* Provider */}
      {mode === "direct" && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-neutral-300">Provider</h2>
          <div className="flex gap-2">
            {Object.values(LLM_PROVIDER).map((p) => (
              <button
                key={p}
                onClick={() => setProvider(p)}
                className={cn(
                  "rounded-md border px-4 py-2 text-sm capitalize transition-colors",
                  provider === p
                    ? "border-neutral-500 bg-neutral-800 text-neutral-100"
                    : "border-white/8 text-neutral-400 hover:border-white/15 hover:text-neutral-300",
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
          <h2 className="text-sm font-semibold text-neutral-300">
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
                "flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-neutral-200",
                "placeholder:text-neutral-600 focus:border-white/25 focus:outline-none",
              )}
            />
            <button
              onClick={() => setShowKey((v) => !v)}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-neutral-400 transition-colors hover:text-neutral-200"
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
        <h2 className="text-sm font-semibold text-neutral-300">
          Completion Mode
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setReviewMode(false)}
            className={cn(
              "rounded-lg border p-4 text-left transition-colors",
              !reviewMode
                ? "border-neutral-500 bg-neutral-800 text-neutral-100"
                : "border-white/8 bg-white/4 text-neutral-400 hover:border-white/15",
            )}
          >
            <p className="text-sm font-medium">Instant</p>
            <p className="mt-1 text-xs text-neutral-500">
              Replaces text immediately
            </p>
          </button>
          <button
            onClick={() => setReviewMode(true)}
            className={cn(
              "rounded-lg border p-4 text-left transition-colors",
              reviewMode
                ? "border-neutral-500 bg-neutral-800 text-neutral-100"
                : "border-white/8 bg-white/4 text-neutral-400 hover:border-white/15",
            )}
          >
            <p className="text-sm font-medium">Review</p>
            <p className="mt-1 text-xs text-neutral-500">
              Preview before applying
            </p>
          </button>
        </div>
      </section>

      {/* Model */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-neutral-300">Model</h2>
        <select
          disabled
          value={model}
          className={cn(
            "w-full cursor-not-allowed rounded-lg border border-white/8 bg-white/4 px-3 py-2",
            "text-sm text-neutral-500 focus:outline-none",
          )}
        >
          <option value={model}>{model}</option>
        </select>
        <p className="text-xs text-neutral-600">More models coming soon</p>
      </section>
    </div>
  );
}
