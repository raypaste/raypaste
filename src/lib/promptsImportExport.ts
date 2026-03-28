import type { Prompt, WebsitePromptSite } from "#/stores/promptsStore";

export interface ExportedPromptFile {
  version: 1;
  exportedAt: string;
  defaultPromptId: string | null;
  prompts: ExportedPrompt[];
  websitePromptSites: ExportedWebsitePromptSite[];
}

export interface ExportedPrompt {
  id: string;
  name: string;
  text: string;
  notes: string;
  appIds: string[];
}

export interface ExportedWebsitePromptSite {
  id: string;
  domain: string;
  rules: ExportedWebsitePromptSiteRule[];
}

export interface ExportedWebsitePromptSiteRule {
  id: string;
  kind: "site" | "path-prefix";
  value: string;
  promptId: string;
  label: string;
}

export type ImportMode = "merge" | "replace";

export interface ImportPreview {
  payload: ExportedPromptFile;
  promptCount: number;
  siteCount: number;
  appAssignmentCount: number;
  ruleCount: number;
}

export function buildExportPayload(
  prompts: Prompt[],
  websitePromptSites: WebsitePromptSite[],
  defaultPromptId: string | null,
): ExportedPromptFile {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    defaultPromptId,
    prompts: prompts.map(({ id, name, text, notes, appIds }) => ({
      id,
      name,
      text,
      notes,
      appIds,
    })),
    websitePromptSites: websitePromptSites.map(({ id, domain, rules }) => ({
      id,
      domain,
      rules: rules.map(({ id, kind, value, promptId, label }) => ({
        id,
        kind,
        value,
        promptId,
        label,
      })),
    })),
  };
}

/**
 * Builds an export payload containing only the prompts whose IDs are in
 * `selectedPromptIds`. Website sites are included only when they have at
 * least one rule pointing to a selected prompt. `defaultPromptId` is
 * preserved only when the default prompt is selected.
 */
export function buildExportPayloadForSelection(
  selectedPromptIds: ReadonlySet<string>,
  allPrompts: Prompt[],
  allWebsitePromptSites: WebsitePromptSite[],
  defaultPromptId: string | null,
): ExportedPromptFile {
  const selectedPrompts = allPrompts.filter((p) => selectedPromptIds.has(p.id));

  const filteredSites = allWebsitePromptSites
    .map((site) => ({
      ...site,
      rules: site.rules.filter((r) => selectedPromptIds.has(r.promptId)),
    }))
    .filter((site) => site.rules.length > 0);

  const filteredDefaultId =
    defaultPromptId !== null && selectedPromptIds.has(defaultPromptId)
      ? defaultPromptId
      : null;

  return buildExportPayload(selectedPrompts, filteredSites, filteredDefaultId);
}

export function downloadAsJson(
  data: ExportedPromptFile,
  filename: string,
): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function assertString(val: unknown, field: string): asserts val is string {
  if (typeof val !== "string") {
    throw new Error(`Expected "${field}" to be a string, got ${typeof val}`);
  }
}

function assertArray(val: unknown, field: string): asserts val is unknown[] {
  if (!Array.isArray(val)) {
    throw new Error(`Expected "${field}" to be an array`);
  }
}

export function validateImportPayload(raw: unknown): ExportedPromptFile {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    throw new Error("Invalid format: expected a JSON object");
  }

  const d = raw as Record<string, unknown>;

  if (d.version !== 1) {
    throw new Error(
      `Unsupported version: expected 1, got ${JSON.stringify(d.version)}`,
    );
  }

  if (typeof d.exportedAt !== "string" || !d.exportedAt) {
    throw new Error('Expected "exportedAt" to be a non-empty string');
  }

  if (d.defaultPromptId !== null && typeof d.defaultPromptId !== "string") {
    throw new Error('Expected "defaultPromptId" to be a string or null');
  }

  assertArray(d.prompts, "prompts");
  for (let i = 0; i < d.prompts.length; i++) {
    const p = d.prompts[i] as Record<string, unknown>;
    const prefix = `prompts[${i}]`;
    assertString(p.id, `${prefix}.id`);
    assertString(p.name, `${prefix}.name`);
    assertString(p.text, `${prefix}.text`);
    assertString(p.notes, `${prefix}.notes`);
    assertArray(p.appIds, `${prefix}.appIds`);
    for (let j = 0; j < (p.appIds as unknown[]).length; j++) {
      assertString((p.appIds as unknown[])[j], `${prefix}.appIds[${j}]`);
    }
  }

  assertArray(d.websitePromptSites, "websitePromptSites");
  for (let i = 0; i < d.websitePromptSites.length; i++) {
    const site = d.websitePromptSites[i] as Record<string, unknown>;
    const sitePrefix = `websitePromptSites[${i}]`;
    assertString(site.id, `${sitePrefix}.id`);
    assertString(site.domain, `${sitePrefix}.domain`);
    assertArray(site.rules, `${sitePrefix}.rules`);
    for (let j = 0; j < (site.rules as unknown[]).length; j++) {
      const rule = (site.rules as unknown[])[j] as Record<string, unknown>;
      const rulePrefix = `${sitePrefix}.rules[${j}]`;
      assertString(rule.id, `${rulePrefix}.id`);
      if (rule.kind !== "site" && rule.kind !== "path-prefix") {
        throw new Error(
          `Expected "${rulePrefix}.kind" to be "site" or "path-prefix", got ${JSON.stringify(rule.kind)}`,
        );
      }
      assertString(rule.value, `${rulePrefix}.value`);
      assertString(rule.promptId, `${rulePrefix}.promptId`);
      assertString(rule.label, `${rulePrefix}.label`);
    }
  }

  return raw as ExportedPromptFile;
}

export function parseImportPayload(jsonText: string): ImportPreview {
  const raw: unknown = JSON.parse(jsonText);
  const payload = validateImportPayload(raw);

  const promptCount = payload.prompts.length;
  const siteCount = payload.websitePromptSites.length;
  const appAssignmentCount = payload.prompts.reduce(
    (sum, p) => sum + p.appIds.length,
    0,
  );
  const ruleCount = payload.websitePromptSites.reduce(
    (sum, s) => sum + s.rules.length,
    0,
  );

  return { payload, promptCount, siteCount, appAssignmentCount, ruleCount };
}
