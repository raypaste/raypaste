import { useSettingsStore } from "#/stores";
import { openrouterClient } from "./openrouter";
import { cerebrasClient } from "./cerebras";
import { raypasteApiClient } from "./raypaste-api";
import { dryRunClient } from "./dryRun";
import type { LLMClient } from "./types";
import { LLM_PROVIDER } from "./types";

export const DRY_RUN = import.meta.env.VITE_DRY_RUN === "true";

export function getLLMClient(): LLMClient {
  if (DRY_RUN) {
    return dryRunClient;
  }

  const { mode, provider } = useSettingsStore.getState();
  if (mode === "api") {
    return raypasteApiClient;
  }

  return provider === LLM_PROVIDER.Cerebras ? cerebrasClient : openrouterClient;
}

export function getApiKey(): string {
  if (DRY_RUN) {
    return "dry-run";
  }

  const { provider, openrouterApiKey, cerebrasApiKey } =
    useSettingsStore.getState();

  return provider === LLM_PROVIDER.Cerebras ? cerebrasApiKey : openrouterApiKey;
}

export type { LLMClient, LLMRequest, LLMMessage } from "./types";
