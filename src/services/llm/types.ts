export const LLM_PROVIDER = {
  OpenRouter: "openrouter",
  Cerebras: "cerebras",
} as const;

export type LLMProvider = (typeof LLM_PROVIDER)[keyof typeof LLM_PROVIDER];

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMRequest {
  messages: LLMMessage[];
  model: string;
  stream?: boolean;
}

export interface LLMClient {
  complete(req: LLMRequest, apiKey: string): Promise<string>;
  stream(
    req: LLMRequest,
    apiKey: string,
    onChunk: (text: string) => void,
  ): Promise<void>;
}
