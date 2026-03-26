import { describe, it, expect } from "vitest";
import { avgTokPerSec, avgCompletionTime } from "./helpers";
import type { UsageStatsRow } from "#/services/db";

function row(partial: Partial<UsageStatsRow>): UsageStatsRow {
  return {
    id: "global",
    totalCompletions: 0,
    totalApplied: 0,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalCompletionMs: 0,
    promptStats: {},
    appStats: {},
    ...partial,
  };
}

describe("history helpers", () => {
  it("avgTokPerSec returns em dash when no completion time", () => {
    expect(avgTokPerSec(row({ totalCompletionMs: 0 }))).toBe("—");
  });

  it("avgCompletionTime returns em dash when no completions", () => {
    expect(avgCompletionTime(row({ totalCompletions: 0 }))).toBe("—");
  });

  it("avgCompletionTime divides total ms by completion count", () => {
    expect(
      avgCompletionTime(row({ totalCompletions: 2, totalCompletionMs: 5000 })),
    ).toBe("2.50s");
  });
});
