import type { LLMClient, LLMCompletion } from "./types";

export const raypasteApiClient: LLMClient = {
  async complete(): Promise<LLMCompletion> {
    throw new Error("Raypaste API — coming soon");
  },
  async stream(): Promise<void> {
    throw new Error("Raypaste API — coming soon");
  },
};
