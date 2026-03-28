import { describe, it, expect, beforeEach } from "vitest";
import {
  usePromptsStore,
  pickWebsitePromptMatch,
  recomputePromptWebsiteSiteIds,
  normalizeDomainInput,
  type Prompt,
  type WebsitePromptSite,
} from "./promptsStore";
import type { ExportedPromptFile } from "#/lib/promptsImportExport";

const FORMAL: Prompt = {
  id: "formal",
  name: "Formal",
  text: "Make this text more formal",
  notes: "",
  appIds: [],
  websitePromptSiteIds: [],
};

function resetPromptsStore() {
  usePromptsStore.setState({
    prompts: [FORMAL],
    defaultPromptId: null,
    websitePromptSites: [],
  });
}

describe("pickWebsitePromptMatch", () => {
  it("prefers longer registered domain when multiple sites match host", () => {
    const sites: WebsitePromptSite[] = [
      {
        id: "a",
        domain: "google.com",
        iconSrc: null,
        iconStatus: "idle",
        rules: [
          {
            id: "r1",
            kind: "site",
            value: "",
            promptId: "p-wide",
            label: "",
          },
        ],
      },
      {
        id: "b",
        domain: "mail.google.com",
        iconSrc: null,
        iconStatus: "idle",
        rules: [
          {
            id: "r2",
            kind: "site",
            value: "",
            promptId: "p-specific",
            label: "",
          },
        ],
      },
    ];
    const m = pickWebsitePromptMatch(sites, "https://mail.google.com/inbox");
    expect(m?.promptId).toBe("p-specific");
    expect(m?.matchedWebsitePattern).toBe("mail.google.com");
  });

  it("prefers longer path-prefix over shorter on same site", () => {
    const sites: WebsitePromptSite[] = [
      {
        id: "s",
        domain: "example.com",
        iconSrc: null,
        iconStatus: "idle",
        rules: [
          {
            id: "short",
            kind: "path-prefix",
            value: "https://example.com/a",
            promptId: "p-short",
            label: "",
          },
          {
            id: "long",
            kind: "path-prefix",
            value: "https://example.com/a/b",
            promptId: "p-long",
            label: "",
          },
        ],
      },
    ];
    const m = pickWebsitePromptMatch(sites, "https://example.com/a/b/c");
    expect(m?.promptId).toBe("p-long");
  });

  it("uses site rule when no path-prefix matches", () => {
    const sites: WebsitePromptSite[] = [
      {
        id: "s",
        domain: "example.com",
        iconSrc: null,
        iconStatus: "idle",
        rules: [
          {
            id: "path",
            kind: "path-prefix",
            value: "https://example.com/other",
            promptId: "p-path",
            label: "",
          },
          {
            id: "whole",
            kind: "site",
            value: "",
            promptId: "p-site",
            label: "",
          },
        ],
      },
    ];
    const m = pickWebsitePromptMatch(sites, "https://example.com/docs");
    expect(m?.promptId).toBe("p-site");
    expect(m?.matchedWebsitePattern).toBe("example.com");
  });

  it("returns null for invalid page URL", () => {
    expect(pickWebsitePromptMatch([], "not-a-url")).toBeNull();
  });
});

describe("normalizeDomainInput", () => {
  it("normalizes bare host and strips trailing dots", () => {
    expect(normalizeDomainInput("Example.COM.")).toBe("example.com");
  });
});

describe("recomputePromptWebsiteSiteIds", () => {
  it("maps prompts to sites that reference them in rules", () => {
    const prompts: Prompt[] = [
      { ...FORMAL, id: "a", websitePromptSiteIds: [] },
      { ...FORMAL, id: "b", name: "B", websitePromptSiteIds: [] },
    ];
    const sites: WebsitePromptSite[] = [
      {
        id: "site-1",
        domain: "x.com",
        iconSrc: null,
        iconStatus: "idle",
        rules: [
          {
            id: "r",
            kind: "site",
            value: "",
            promptId: "a",
            label: "",
          },
        ],
      },
    ];
    const next = recomputePromptWebsiteSiteIds(prompts, sites);
    expect(next.find((p) => p.id === "a")?.websitePromptSiteIds).toEqual([
      "site-1",
    ]);
    expect(next.find((p) => p.id === "b")?.websitePromptSiteIds).toEqual([]);
  });
});

describe("usePromptsStore actions", () => {
  beforeEach(() => {
    resetPromptsStore();
  });

  it("deletePrompt removes prompt, clears default, strips website rules, recomputes websitePromptSiteIds", () => {
    const { addPrompt, deletePrompt, setDefaultPrompt } =
      usePromptsStore.getState();
    addPrompt({
      id: "to-delete",
      name: "X",
      text: "text",
    });
    usePromptsStore.setState({
      websitePromptSites: [
        {
          id: "ws",
          domain: "foo.com",
          iconSrc: null,
          iconStatus: "idle",
          rules: [
            {
              id: "rule-1",
              kind: "site",
              value: "",
              promptId: "to-delete",
              label: "",
            },
            {
              id: "rule-2",
              kind: "site",
              value: "",
              promptId: "formal",
              label: "",
            },
          ],
        },
      ],
    });
    usePromptsStore.setState((s) => ({
      prompts: recomputePromptWebsiteSiteIds(s.prompts, s.websitePromptSites),
    }));
    expect(
      usePromptsStore.getState().prompts.find((p) => p.id === "to-delete")
        ?.websitePromptSiteIds,
    ).toEqual(["ws"]);

    setDefaultPrompt("to-delete");
    deletePrompt("to-delete");

    const state = usePromptsStore.getState();
    expect(state.prompts.some((p) => p.id === "to-delete")).toBe(false);
    expect(state.defaultPromptId).toBeNull();
    expect(state.websitePromptSites[0].rules).toHaveLength(1);
    expect(state.websitePromptSites[0].rules[0].promptId).toBe("formal");
    expect(
      state.prompts.find((p) => p.id === "formal")?.websitePromptSiteIds,
    ).toEqual(["ws"]);
  });

  it("assignAppToPrompt assigns app exclusively to one prompt", () => {
    const { addPrompt, assignAppToPrompt } = usePromptsStore.getState();
    addPrompt({ id: "p1", name: "A", text: "a" });
    addPrompt({ id: "p2", name: "B", text: "b" });
    assignAppToPrompt("p1", "com.app");
    expect(
      usePromptsStore.getState().prompts.find((p) => p.id === "p1")?.appIds,
    ).toEqual(["com.app"]);
    assignAppToPrompt("p2", "com.app");
    const state = usePromptsStore.getState();
    expect(state.prompts.find((p) => p.id === "p1")?.appIds).toEqual([]);
    expect(state.prompts.find((p) => p.id === "p2")?.appIds).toEqual([
      "com.app",
    ]);
  });

  it("resolvePromptForHotkey uses website match when URL and prompt exist", () => {
    const { addPrompt } = usePromptsStore.getState();
    addPrompt({ id: "web-p", name: "Web", text: "w" });
    usePromptsStore.setState({
      websitePromptSites: [
        {
          id: "s",
          domain: "news.example.com",
          iconSrc: null,
          iconStatus: "idle",
          rules: [
            {
              id: "r",
              kind: "site",
              value: "",
              promptId: "web-p",
              label: "",
            },
          ],
        },
      ],
    });
    usePromptsStore.setState((st) => ({
      prompts: recomputePromptWebsiteSiteIds(st.prompts, st.websitePromptSites),
    }));

    const r = usePromptsStore
      .getState()
      .resolvePromptForHotkey("com.other", "https://news.example.com/page");
    expect(r?.source).toBe("website");
    expect(r?.prompt.id).toBe("web-p");
  });

  it("resolvePromptForHotkey falls back when website match references missing prompt", () => {
    usePromptsStore.setState({
      websitePromptSites: [
        {
          id: "s",
          domain: "example.com",
          iconSrc: null,
          iconStatus: "idle",
          rules: [
            {
              id: "r",
              kind: "site",
              value: "",
              promptId: "deleted-id",
              label: "",
            },
          ],
        },
      ],
    });

    const r = usePromptsStore
      .getState()
      .resolvePromptForHotkey("com.any", "https://example.com/");
    expect(r?.prompt.id).toBe("formal");
    expect(r?.source).toBe("builtin");
  });

  it("resolvePromptForHotkey uses app then default then formal", () => {
    const { addPrompt, assignAppToPrompt, setDefaultPrompt } =
      usePromptsStore.getState();
    addPrompt({ id: "app-p", name: "App", text: "a" });
    addPrompt({ id: "def-p", name: "Def", text: "d" });
    assignAppToPrompt("app-p", "com.focused");
    const noApp = usePromptsStore
      .getState()
      .resolvePromptForHotkey("com.other", null);
    expect(noApp?.source).toBe("builtin");

    setDefaultPrompt("def-p");
    const withDefault = usePromptsStore
      .getState()
      .resolvePromptForHotkey("com.other", null);
    expect(withDefault?.prompt.id).toBe("def-p");
    expect(withDefault?.source).toBe("default");

    const withApp = usePromptsStore
      .getState()
      .resolvePromptForHotkey("com.focused", null);
    expect(withApp?.prompt.id).toBe("app-p");
    expect(withApp?.source).toBe("app");
  });
});

// ---------------------------------------------------------------------------
// importPrompts
// ---------------------------------------------------------------------------

function makePayload(
  overrides?: Partial<ExportedPromptFile>,
): ExportedPromptFile {
  return {
    version: 1,
    exportedAt: "2026-03-28T00:00:00.000Z",
    defaultPromptId: "casual",
    prompts: [
      {
        id: "casual",
        name: "Casual",
        text: "Keep it casual",
        notes: "",
        appIds: ["com.apple.Safari"],
      },
    ],
    websitePromptSites: [
      {
        id: "site-1",
        domain: "example.com",
        rules: [
          {
            id: "rule-1",
            kind: "site",
            value: "example.com",
            promptId: "casual",
            label: "Example",
          },
        ],
      },
    ],
    ...overrides,
  };
}

describe("importPrompts – replace mode", () => {
  beforeEach(resetPromptsStore);

  it("replaces all three store fields", () => {
    const { importPrompts } = usePromptsStore.getState();
    importPrompts(makePayload(), "replace");
    const { prompts, websitePromptSites, defaultPromptId } =
      usePromptsStore.getState();
    expect(prompts.map((p) => p.id)).toEqual(["casual"]);
    expect(websitePromptSites.map((s) => s.id)).toEqual(["site-1"]);
    expect(defaultPromptId).toBe("casual");
  });

  it("resets iconSrc and iconStatus to idle on imported sites", () => {
    const { importPrompts } = usePromptsStore.getState();
    importPrompts(makePayload(), "replace");
    const site = usePromptsStore.getState().websitePromptSites[0];
    expect(site.iconSrc).toBeNull();
    expect(site.iconStatus).toBe("idle");
  });

  it("recomputes websitePromptSiteIds for imported prompts", () => {
    const { importPrompts } = usePromptsStore.getState();
    importPrompts(makePayload(), "replace");
    const prompt = usePromptsStore
      .getState()
      .prompts.find((p) => p.id === "casual")!;
    expect(prompt.websitePromptSiteIds).toEqual(["site-1"]);
  });

  it("returns counts equal to payload lengths", () => {
    const { importPrompts } = usePromptsStore.getState();
    const result = importPrompts(makePayload(), "replace");
    expect(result.importedPromptCount).toBe(1);
    expect(result.importedSiteCount).toBe(1);
  });

  it("sets defaultPromptId from payload even when null", () => {
    const { importPrompts } = usePromptsStore.getState();
    importPrompts(makePayload({ defaultPromptId: null }), "replace");
    expect(usePromptsStore.getState().defaultPromptId).toBeNull();
  });
});

describe("importPrompts – merge mode", () => {
  beforeEach(resetPromptsStore);

  it("adds prompts whose ID does not exist", () => {
    const { importPrompts } = usePromptsStore.getState();
    importPrompts(makePayload(), "merge");
    const ids = usePromptsStore.getState().prompts.map((p) => p.id);
    expect(ids).toContain("formal");
    expect(ids).toContain("casual");
  });

  it("skips prompts whose ID already exists", () => {
    // "formal" is in both existing state and payload
    const payload = makePayload({
      prompts: [
        {
          id: "formal",
          name: "OVERRIDE",
          text: "override",
          notes: "",
          appIds: [],
        },
        { id: "new-one", name: "New", text: "new", notes: "", appIds: [] },
      ],
    });
    const { importPrompts } = usePromptsStore.getState();
    importPrompts(payload, "merge");
    const { prompts } = usePromptsStore.getState();
    const formal = prompts.find((p) => p.id === "formal")!;
    expect(formal.name).toBe("Formal"); // original, not overridden
    expect(prompts.find((p) => p.id === "new-one")).toBeDefined();
  });

  it("does not change defaultPromptId", () => {
    usePromptsStore.setState({ defaultPromptId: "formal" });
    const { importPrompts } = usePromptsStore.getState();
    importPrompts(makePayload({ defaultPromptId: "casual" }), "merge");
    expect(usePromptsStore.getState().defaultPromptId).toBe("formal");
  });

  it("returns only the count of newly added items", () => {
    // "formal" already exists; "casual" is new
    const payload = makePayload({
      prompts: [
        { id: "formal", name: "Formal", text: "x", notes: "", appIds: [] },
        { id: "casual", name: "Casual", text: "y", notes: "", appIds: [] },
      ],
      websitePromptSites: [],
    });
    const { importPrompts } = usePromptsStore.getState();
    const result = importPrompts(payload, "merge");
    expect(result.importedPromptCount).toBe(1); // only casual is new
    expect(result.importedSiteCount).toBe(0);
  });

  it("recomputes websitePromptSiteIds after merge (new site points to existing prompt)", () => {
    const payload = makePayload({
      prompts: [],
      websitePromptSites: [
        {
          id: "site-new",
          domain: "test.com",
          rules: [
            {
              id: "r",
              kind: "site",
              value: "test.com",
              promptId: "formal",
              label: "Test",
            },
          ],
        },
      ],
    });
    const { importPrompts } = usePromptsStore.getState();
    importPrompts(payload, "merge");
    const formal = usePromptsStore
      .getState()
      .prompts.find((p) => p.id === "formal")!;
    expect(formal.websitePromptSiteIds).toContain("site-new");
  });

  it("skips sites whose ID already exists", () => {
    usePromptsStore.setState({
      websitePromptSites: [
        {
          id: "site-1",
          domain: "existing.com",
          iconSrc: null,
          iconStatus: "idle",
          rules: [],
        },
      ],
    });
    const { importPrompts } = usePromptsStore.getState();
    importPrompts(makePayload(), "merge"); // payload also has site-1
    const sites = usePromptsStore.getState().websitePromptSites;
    expect(sites.length).toBe(1);
    expect(sites[0].domain).toBe("existing.com"); // original preserved
  });
});
