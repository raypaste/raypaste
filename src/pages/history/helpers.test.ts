import { describe, it, expect } from "vitest";
import {
  avgTokPerSec,
  avgCompletionTime,
  findWebsiteSiteIdForCompletion,
} from "./helpers";
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

  it("findWebsiteSiteIdForCompletion resolves site rule by domain pattern", () => {
    const siteId = findWebsiteSiteIdForCompletion(
      [
        {
          id: "s1",
          domain: "example.com",
          iconSrc: null,
          iconStatus: "idle",
          rules: [
            {
              id: "r1",
              kind: "site",
              value: "",
              promptId: "p1",
              label: "",
            },
          ],
        },
      ],
      "example.com",
      "p1",
    );
    expect(siteId).toBe("s1");
  });

  it("findWebsiteSiteIdForCompletion resolves path-prefix match", () => {
    const prefix = "https://example.com/inbox";
    const siteId = findWebsiteSiteIdForCompletion(
      [
        {
          id: "s2",
          domain: "example.com",
          iconSrc: null,
          iconStatus: "idle",
          rules: [
            {
              id: "r2",
              kind: "path-prefix",
              value: prefix,
              promptId: "p2",
              label: "",
            },
          ],
        },
      ],
      prefix,
      "p2",
    );
    expect(siteId).toBe("s2");
  });
});
