import type { LLMClient } from "./types";

export const raypasteApiClient: LLMClient = {
  async complete(): Promise<string> {
    throw new Error("Raypaste API — coming soon");
  },
  async stream(): Promise<void> {
    throw new Error("Raypaste API — coming soon");
  },
};
