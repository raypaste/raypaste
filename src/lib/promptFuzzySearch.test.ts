import { describe, it, expect } from "vitest";
import type { Prompt, WebsitePromptSite } from "#/stores/promptsStore";
import type { InstalledApp } from "#/stores/appsStore";
import {
  buildPromptSearchIndex,
  filterAndSortPromptsByFuzzyQuery,
  type PromptSearchRow,
} from "./promptFuzzySearch";

function prompt(
  overrides: Partial<Prompt> & Pick<Prompt, "id" | "name">,
): Prompt {
  return {
    text: "",
    notes: "",
    appIds: [],
    websitePromptSiteIds: [],
    ...overrides,
  };
}

function site(
  overrides: Partial<WebsitePromptSite> &
    Pick<WebsitePromptSite, "id" | "domain">,
): WebsitePromptSite {
  return {
    iconSrc: null,
    iconStatus: "idle",
    rules: [],
    ...overrides,
  };
}

describe("buildPromptSearchIndex", () => {
  it("labels unassigned prompts and indexes the prompt name", () => {
    const rows = buildPromptSearchIndex(
      [prompt({ id: "p1", name: "Formal reply" })],
      [],
      [],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      id: "p1",
      promptName: "Formal reply",
      contextLabel: "Unassigned",
    });
    expect(rows[0]!.searchFields).toEqual(
      expect.arrayContaining(["Formal reply", "Unassigned"]),
    );
  });

  it("resolves app names from bundle ids and adds them to context and search fields", () => {
    const apps: InstalledApp[] = [
      { name: "Notes", bundleId: "com.apple.Notes" },
    ];
    const rows = buildPromptSearchIndex(
      [
        prompt({
          id: "p1",
          name: "Summarize",
          appIds: ["com.apple.Notes"],
        }),
      ],
      apps,
      [],
    );
    expect(rows[0]).toMatchObject({
      promptName: "Summarize",
      contextLabel: "Notes",
    });
    expect(rows[0]!.searchFields).toEqual(
      expect.arrayContaining(["Summarize", "Notes", "Notes"]),
    );
  });

  it("expands website domains into search variants (registered + apex + second-level label)", () => {
    const sites = [site({ id: "s1", domain: "api.github.com" })];
    const rows = buildPromptSearchIndex(
      [
        prompt({
          id: "p1",
          name: "PR review",
          websitePromptSiteIds: ["s1"],
        }),
      ],
      [],
      sites,
    );
    expect(rows[0]!.contextLabel).toBe("api.github.com");
    expect(rows[0]!.searchFields).toEqual(
      expect.arrayContaining([
        "PR review",
        "api.github.com",
        "github.com",
        "github",
        "api.github.com",
      ]),
    );
  });

  it("joins multiple apps and site domains in the context label", () => {
    const apps: InstalledApp[] = [
      { name: "Slack", bundleId: "com.tinyspeck.slackmacgap" },
    ];
    const sites = [site({ id: "s1", domain: "example.com" })];
    const rows = buildPromptSearchIndex(
      [
        prompt({
          id: "p1",
          name: "Both",
          appIds: ["com.tinyspeck.slackmacgap"],
          websitePromptSiteIds: ["s1"],
        }),
      ],
      apps,
      sites,
    );
    expect(rows[0]!.contextLabel).toBe("Slack · example.com");
  });
});

describe("filterAndSortPromptsByFuzzyQuery", () => {
  const baseRows = (): PromptSearchRow[] => [
    { id: "a", promptName: "Alpha", contextLabel: "Unassigned" },
    { id: "b", promptName: "Beta", contextLabel: "Unassigned" },
  ];

  it("returns all rows in index order when the query is empty or whitespace", () => {
    const index = buildPromptSearchIndex(
      [prompt({ id: "a", name: "Alpha" }), prompt({ id: "b", name: "Beta" })],
      [],
      [],
    );
    expect(filterAndSortPromptsByFuzzyQuery(index, "")).toEqual(baseRows());
    expect(filterAndSortPromptsByFuzzyQuery(index, "   ")).toEqual(baseRows());
  });

  it("matches case-insensitively on any indexed field", () => {
    const index = buildPromptSearchIndex(
      [
        prompt({
          id: "p1",
          name: "Formal",
          appIds: [],
          websitePromptSiteIds: [],
        }),
      ],
      [],
      [],
    );
    const out = filterAndSortPromptsByFuzzyQuery(index, "FORMAL");
    expect(out).toEqual([
      { id: "p1", promptName: "Formal", contextLabel: "Unassigned" },
    ]);
  });

  it("requires every whitespace-separated token to match somewhere (AND)", () => {
    const index = buildPromptSearchIndex(
      [
        prompt({ id: "ok", name: "Reply polite" }),
        prompt({ id: "no", name: "Reply terse" }),
      ],
      [],
      [],
    );
    const out = filterAndSortPromptsByFuzzyQuery(index, "reply polite");
    expect(out.map((r) => r.id)).toEqual(["ok"]);
  });

  it("matches letters in order when not a contiguous substring (fuzzy subsequence)", () => {
    const index = buildPromptSearchIndex(
      [prompt({ id: "p1", name: "abcdefghij" })],
      [],
      [],
    );
    const out = filterAndSortPromptsByFuzzyQuery(index, "ace");
    expect(out).toHaveLength(1);
    expect(out[0]!.id).toBe("p1");
  });

  it("excludes rows with no fuzzy match for any token", () => {
    const index = buildPromptSearchIndex(
      [prompt({ id: "p1", name: "Hello" })],
      [],
      [],
    );
    expect(filterAndSortPromptsByFuzzyQuery(index, "zzz")).toEqual([]);
  });

  it("ranks earlier substring hits higher than later ones", () => {
    const index = buildPromptSearchIndex(
      [
        prompt({ id: "late", name: "xxxhello" }),
        prompt({ id: "early", name: "helloxxx" }),
      ],
      [],
      [],
    );
    const out = filterAndSortPromptsByFuzzyQuery(index, "hello");
    expect(out.map((r) => r.id)).toEqual(["early", "late"]);
  });

  it("strips searchFields from the output rows", () => {
    const index = buildPromptSearchIndex(
      [prompt({ id: "p1", name: "Test" })],
      [],
      [],
    );
    const out = filterAndSortPromptsByFuzzyQuery(index, "test");
    expect(out[0]).not.toHaveProperty("searchFields");
  });
});
