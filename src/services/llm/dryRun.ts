import type { LLMClient, LLMRequest } from "./types";

export const dryRunClient: LLMClient = {
  async complete(req: LLMRequest) {
    const userMessage =
      [...req.messages].reverse().find((m) => m.role === "user")?.content ?? "";
    await new Promise((r) => setTimeout(r, 500)); // simulate latency

    return {
      text: `[DRY RUN] ${userMessage}`,
      usage: { input_tokens: null, output_tokens: null },
    };
  },

  async stream(
    req: LLMRequest,
    _apiKey: string,
    onChunk: (text: string) => void,
    signal?: AbortSignal,
  ) {
    const userMessage =
      [...req.messages].reverse().find((m) => m.role === "user")?.content ?? "";
    const words = `[DRY RUN] ${userMessage}`.split(" ");

    for (const word of words) {
      await new Promise((r) => setTimeout(r, 80));
      if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
      onChunk(word + " ");
    }
  },
};
