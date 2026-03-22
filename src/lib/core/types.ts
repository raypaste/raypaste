export interface ModeParams {
  signal: AbortSignal;
  selected_text: string;
  target_pid: number;
  app: string;
  prompt: { id: string; name: string; text: string };
  model: string;
  provider: string;
  completionId: string;
  t0: number;
  apiKey: string;
}

export function isAbortError(err: unknown): boolean {
  return err instanceof DOMException && err.name === "AbortError";
}
