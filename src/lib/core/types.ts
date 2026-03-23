import type { PromptSource } from "#/stores";

export interface ModeParams {
  signal: AbortSignal;
  selected_text: string;
  target_pid: number;
  app: string;
  prompt: { id: string; name: string; text: string };
  promptSource: PromptSource;
  pageUrl: string | null;
  matchedWebsitePattern: string | null;
  model: string;
  provider: string;
  completionId: string;
  t0: number;
  apiKey: string;
}

export function isAbortError(err: unknown): boolean {
  return err instanceof DOMException && err.name === "AbortError";
}
