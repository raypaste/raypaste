import type { LLMRequest } from "./types";

/** JSON body for OpenAI-compatible chat/completions (strips Raypaste-only fields). */
export function chatCompletionBody(req: LLMRequest, stream: boolean) {
  const { dryRunMetadata, ...rest } = req;
  void dryRunMetadata;
  return { ...rest, stream };
}
