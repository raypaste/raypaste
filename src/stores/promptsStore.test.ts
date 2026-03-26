import { describe, it, expect, beforeEach } from "vitest";
import {
  usePromptsStore,
  pickWebsitePromptMatch,
  recomputePromptWebsiteSiteIds,
  normalizeDomainInput,
  type Prompt,
  type WebsitePromptSite,
} from "./promptsStore";

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
