import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Prompt, WebsitePromptSite } from "#/stores/promptsStore";
import {
  buildExportPayload,
  validateImportPayload,
  parseImportPayload,
  downloadAsJson,
  type ExportedPromptFile,
} from "./promptsImportExport";

function makePrompt(
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

function makeValidPayload(): ExportedPromptFile {
  return {
    version: 1,
    exportedAt: "2026-03-28T00:00:00.000Z",
    defaultPromptId: "formal",
    prompts: [
      {
        id: "formal",
        name: "Formal",
        text: "Make formal",
        notes: "",
        appIds: ["com.apple.Safari"],
      },
      {
        id: "casual",
        name: "Casual",
        text: "Make casual",
        notes: "note",
        appIds: [],
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
            promptId: "formal",
            label: "Example",
          },
          {
            id: "rule-2",
            kind: "path-prefix",
            value: "/blog",
            promptId: "casual",
            label: "Blog",
          },
        ],
      },
    ],
  };
}

const siteWithIcon: WebsitePromptSite = {
  id: "site-1",
  domain: "example.com",
  iconSrc: "data:image/png;base64,abc",
  iconStatus: "ready",
  rules: [
    {
      id: "rule-1",
      kind: "site",
      value: "example.com",
      promptId: "formal",
      label: "Example",
    },
  ],
};

describe("buildExportPayload", () => {
  const prompts = [
    makePrompt({
      id: "formal",
      name: "Formal",
      text: "Formal",
      appIds: ["com.app.A"],
      websitePromptSiteIds: ["site-1"],
    }),
    makePrompt({ id: "casual", name: "Casual" }),
  ];

  it("strips iconSrc, iconStatus, and websitePromptSiteIds", () => {
    const payload = buildExportPayload(prompts, [siteWithIcon], "formal");

    // No icon fields on sites
    expect(payload.websitePromptSites[0]).not.toHaveProperty("iconSrc");
    expect(payload.websitePromptSites[0]).not.toHaveProperty("iconStatus");

    // No denormalized cache on prompts
    expect(payload.prompts[0]).not.toHaveProperty("websitePromptSiteIds");
  });

  it("preserves prompts fields", () => {
    const payload = buildExportPayload(prompts, [], null);
    expect(payload.prompts[0]).toEqual({
      id: "formal",
      name: "Formal",
      text: "Formal",
      notes: "",
      appIds: ["com.app.A"],
    });
  });

  it("preserves defaultPromptId: null", () => {
    const payload = buildExportPayload(prompts, [], null);
    expect(payload.defaultPromptId).toBeNull();
  });

  it("sets version to 1", () => {
    const payload = buildExportPayload([], [], null);
    expect(payload.version).toBe(1);
  });

  it("sets exportedAt to a non-empty ISO string", () => {
    const payload = buildExportPayload([], [], null);
    expect(typeof payload.exportedAt).toBe("string");
    expect(payload.exportedAt.length).toBeGreaterThan(0);
    expect(() => new Date(payload.exportedAt)).not.toThrow();
  });
});

describe("validateImportPayload", () => {
  it("accepts a valid v1 payload", () => {
    const payload = makeValidPayload();
    expect(() => validateImportPayload(payload)).not.toThrow();
    expect(validateImportPayload(payload)).toBe(payload);
  });

  it("rejects non-object", () => {
    expect(() => validateImportPayload("string")).toThrow(
      /expected a JSON object/i,
    );
    expect(() => validateImportPayload(null)).toThrow();
    expect(() => validateImportPayload([1, 2])).toThrow();
  });

  it("rejects wrong version", () => {
    expect(() =>
      validateImportPayload({ ...makeValidPayload(), version: 2 }),
    ).toThrow(/version/i);
    expect(() =>
      validateImportPayload({ ...makeValidPayload(), version: "1" }),
    ).toThrow(/version/i);
  });

  it("rejects non-array prompts", () => {
    expect(() =>
      validateImportPayload({ ...makeValidPayload(), prompts: "bad" }),
    ).toThrow(/"prompts"/);
    expect(() =>
      validateImportPayload({ ...makeValidPayload(), prompts: null }),
    ).toThrow(/"prompts"/);
  });

  it("rejects prompt missing id", () => {
    const p = makeValidPayload();
    (p.prompts[0] as unknown as Record<string, unknown>).id = 123;
    expect(() => validateImportPayload(p)).toThrow(/"prompts\[0\]\.id"/);
  });

  it("rejects invalid rule kind", () => {
    const p = makeValidPayload();
    (
      p.websitePromptSites[0].rules[0] as unknown as Record<string, unknown>
    ).kind = "wildcard";
    expect(() => validateImportPayload(p)).toThrow(/kind/);
  });

  it("rejects site missing id", () => {
    const p = makeValidPayload();
    (p.websitePromptSites[0] as unknown as Record<string, unknown>).id = 42;
    expect(() => validateImportPayload(p)).toThrow(
      /"websitePromptSites\[0\]\.id"/,
    );
  });

  it("rejects non-string defaultPromptId", () => {
    expect(() =>
      validateImportPayload({ ...makeValidPayload(), defaultPromptId: 123 }),
    ).toThrow(/defaultPromptId/);
  });

  it("accepts defaultPromptId: null", () => {
    expect(() =>
      validateImportPayload({ ...makeValidPayload(), defaultPromptId: null }),
    ).not.toThrow();
  });
});

describe("parseImportPayload", () => {
  it("throws on invalid JSON string", () => {
    expect(() => parseImportPayload("{not json}")).toThrow();
  });

  it("returns correct counts for a known payload", () => {
    const preview = parseImportPayload(JSON.stringify(makeValidPayload()));
    expect(preview.promptCount).toBe(2);
    expect(preview.siteCount).toBe(1);
    expect(preview.appAssignmentCount).toBe(1); // only formal has ["com.apple.Safari"]
    expect(preview.ruleCount).toBe(2);
  });

  it("returns counts of 0 for empty arrays", () => {
    const payload: ExportedPromptFile = {
      version: 1,
      exportedAt: "now",
      defaultPromptId: null,
      prompts: [],
      websitePromptSites: [],
    };
    const preview = parseImportPayload(JSON.stringify(payload));
    expect(preview.promptCount).toBe(0);
    expect(preview.siteCount).toBe(0);
    expect(preview.appAssignmentCount).toBe(0);
    expect(preview.ruleCount).toBe(0);
  });
});

describe("downloadAsJson", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("creates and clicks an anchor element", () => {
    const mockAnchor = {
      href: "",
      download: "",
      click: vi.fn(),
    };
    vi.spyOn(document, "createElement").mockReturnValue(
      mockAnchor as unknown as HTMLElement,
    );
    vi.spyOn(document.body, "appendChild").mockImplementation(
      () => mockAnchor as unknown as HTMLElement,
    );
    vi.spyOn(document.body, "removeChild").mockImplementation(
      () => mockAnchor as unknown as HTMLElement,
    );
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock-url");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});

    const payload = makeValidPayload();
    downloadAsJson(payload, "test.json");

    expect(document.createElement).toHaveBeenCalledWith("a");
    expect(mockAnchor.download).toBe("test.json");
    expect(mockAnchor.href).toBe("blob:mock-url");
    expect(mockAnchor.click).toHaveBeenCalledOnce();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
  });
});
