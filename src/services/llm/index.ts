import { useSettingsStore } from "#/stores";
import { openrouterClient } from "./openrouter";
import { cerebrasClient } from "./cerebras";
import { raypasteApiClient } from "./raypaste-api";
import type { LLMClient } from "./types";
import { LLM_PROVIDER } from "./types";

export function getLLMClient(): LLMClient {
  const { mode, provider } = useSettingsStore.getState();
  if (mode === "api") {
    return raypasteApiClient;
  }

  return provider === LLM_PROVIDER.Cerebras ? cerebrasClient : openrouterClient;
}

export function getApiKey(): string {
  const { provider, openrouterApiKey, cerebrasApiKey } =
    useSettingsStore.getState();
  return provider === LLM_PROVIDER.Cerebras ? cerebrasApiKey : openrouterApiKey;
}

export type { LLMClient, LLMRequest, LLMMessage } from "./types";
