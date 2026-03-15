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

export interface LLMUsage {
  input_tokens: number | null;
  output_tokens: number | null;
}

export interface LLMCompletion {
  text: string;
  usage: LLMUsage;
}

export interface LLMClient {
  complete(
    req: LLMRequest,
    apiKey: string,
    signal?: AbortSignal,
  ): Promise<LLMCompletion>;
  stream(
    req: LLMRequest,
    apiKey: string,
    onChunk: (text: string) => void,
    signal?: AbortSignal,
  ): Promise<void>;
}
