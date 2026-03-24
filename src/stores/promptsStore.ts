import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Prompt {
  id: string;
  name: string;
  text: string;
  notes: string;
  appIds: string[];
}

export type PromptSource = "website" | "app" | "default" | "builtin";

export type WebsitePromptSiteIconStatus =
  | "idle"
  | "loading"
  | "ready"
  | "error";

export interface WebsitePromptSiteRule {
  id: string;
  kind: "site" | "path-prefix";
  value: string;
  promptId: string;
  label: string;
}

export interface WebsitePromptSite {
  id: string;
  domain: string;
  iconSrc: string | null;
  iconStatus: WebsitePromptSiteIconStatus;
  rules: WebsitePromptSiteRule[];
}

export interface PromptResolution {
  prompt: Prompt;
  source: PromptSource;
  pageUrl: string | null;
  matchedWebsitePattern: string | null;
}

function normalizeDomainInput(input: string): string {
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) {
    return "";
  }

  const candidate = /^[a-z]+:\/\//.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    const url = new URL(candidate);
    const normalizedURL = url.hostname.replace(/\.+$/, "");

    return normalizedURL;
  } catch {
    return "";
  }
}

function normalizePathPrefixInput(input: string, domain: string): string {
  const trimmed = input.trim();
  if (!trimmed) {
    return "";
  }

  try {
    const url = new URL(trimmed);
    const normalizedDomain = normalizeDomainInput(domain);
    if (!normalizedDomain) {
      return "";
    }

    const hostname = url.hostname.toLowerCase().replace(/\.+$/, "");
    const matchesDomain =
      hostname === normalizedDomain ||
      hostname.endsWith(`.${normalizedDomain}`);
    if (!matchesDomain) {
      return "";
    }

    return url.toString().replace(/\/$/, "");
  } catch {
    return "";
  }
}

function extractDomainFromPattern(pattern: string): string {
  const trimmed = pattern.trim();
  if (!trimmed) {
    return "";
  }

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    try {
      return new URL(trimmed).hostname.toLowerCase().replace(/\.+$/, "");
    } catch {
      return "";
    }
  }
  return normalizeDomainInput(trimmed);
}

function toStoredRuleValue(
  kind: WebsitePromptSiteRule["kind"],
  value: string,
  domain: string,
): string {
  if (kind === "site") {
    return "";
  }
  return normalizePathPrefixInput(value, domain);
}

function sortWebsitePromptRules(
  rules: WebsitePromptSiteRule[],
): WebsitePromptSiteRule[] {
  return [...rules].sort((a, b) => {
    if (a.kind !== b.kind) {
      return a.kind === "path-prefix" ? -1 : 1;
    }
    if (a.kind === "path-prefix" && b.kind === "path-prefix") {
      return b.value.length - a.value.length;
    }
    return 0;
  });
}

function normalizeWebsitePromptSite(
  site: WebsitePromptSite,
): WebsitePromptSite | null {
  const domain = normalizeDomainInput(site.domain);
  if (!domain && site.rules.length === 0) {
    return {
      ...site,
      domain: "",
      iconSrc: null,
      iconStatus: site.iconStatus ?? "idle",
      rules: [],
    };
  }

  const rules = sortWebsitePromptRules(
    site.rules.map((rule) => ({
      ...rule,
      label: rule.label ?? "",
      value: toStoredRuleValue(rule.kind, rule.value, domain),
      promptId: rule.promptId.trim(),
    })),
  );

  return {
    ...site,
    domain,
    iconSrc: site.iconSrc ?? null,
    iconStatus: site.iconStatus ?? "idle",
    rules,
  };
}

function domainMatches(pageHost: string, siteDomain: string): boolean {
  return pageHost === siteDomain || pageHost.endsWith(`.${siteDomain}`);
}

function pickWebsitePromptMatch(
  sites: WebsitePromptSite[],
  pageUrl: string,
): { promptId: string; matchedWebsitePattern: string } | null {
  let url: URL;
  try {
    url = new URL(pageUrl);
  } catch {
    return null;
  }

  const pageHost = url.hostname.toLowerCase().replace(/\.+$/, "");
  const matchingSites = sites
    .filter((site) => site.domain && domainMatches(pageHost, site.domain))
    .sort((a, b) => b.domain.length - a.domain.length);

  for (const site of matchingSites) {
    const pathRule = sortWebsitePromptRules(site.rules).find(
      (rule) =>
        rule.kind === "path-prefix" &&
        rule.promptId &&
        rule.value &&
        pageUrl.startsWith(rule.value),
    );
    if (pathRule) {
      return {
        promptId: pathRule.promptId,
        matchedWebsitePattern: pathRule.value,
      };
    }

    const siteRule = site.rules.find(
      (rule) => rule.kind === "site" && rule.promptId,
    );
    if (siteRule) {
      return {
        promptId: siteRule.promptId,
        matchedWebsitePattern: site.domain,
      };
    }
  }

  return null;
}

interface PromptsState {
  prompts: Prompt[];
  defaultPromptId: string | null;
  websitePromptSites: WebsitePromptSite[];
  addPrompt: (prompt: {
    id?: string;
    name: string;
    text: string;
    notes?: string;
  }) => void;
  updatePrompt: (id: string, updates: Partial<Omit<Prompt, "id">>) => void;
  deletePrompt: (id: string) => void;
  assignAppToPrompt: (promptId: string, appId: string) => void;
  unassignApp: (appId: string) => void;
  getPromptForApp: (appId: string) => Prompt | undefined;
  setDefaultPrompt: (id: string | null) => void;
  addWebsitePromptSite: () => string;
  updateWebsitePromptSite: (
    id: string,
    updates: Partial<
      Pick<WebsitePromptSite, "domain" | "iconSrc" | "iconStatus">
    >,
  ) => void;
  removeWebsitePromptSite: (id: string) => void;
  addWebsitePromptSiteRule: (
    siteId: string,
    rule?: Partial<
      Pick<WebsitePromptSiteRule, "kind" | "value" | "promptId" | "label">
    >,
  ) => string;
  updateWebsitePromptSiteRule: (
    siteId: string,
    ruleId: string,
    updates: Partial<
      Pick<WebsitePromptSiteRule, "kind" | "value" | "promptId" | "label">
    >,
  ) => void;
  removeWebsitePromptSiteRule: (siteId: string, ruleId: string) => void;
  fetchWebsitePromptSiteIcon: (
    siteId: string,
    fetcher?: (domain: string) => Promise<string | null>,
  ) => Promise<void>;
  resolvePromptForHotkey: (
    appId: string,
    pageUrl: string | null | undefined,
  ) => PromptResolution | undefined;
}

type PersistedPromptsState = Partial<PromptsState> & {
  websitePromptSites?: WebsitePromptSite[];
};

export const usePromptsStore = create<PromptsState>()(
  persist(
    (set, get) => ({
      prompts: [
        {
          id: "formal",
          name: "Formal",
          text: "Make this text more formal",
          notes: "",
          appIds: [],
        },
      ],
      defaultPromptId: null,
      websitePromptSites: [],
      addPrompt: ({ id, name, text, notes = "" }) =>
        set((state) => ({
          prompts: [
            ...state.prompts,
            { id: id ?? crypto.randomUUID(), name, text, notes, appIds: [] },
          ],
        })),
      updatePrompt: (id, updates) =>
        set((state) => ({
          prompts: state.prompts.map((p) =>
            p.id === id ? { ...p, ...updates } : p,
          ),
        })),
      deletePrompt: (id) =>
        set((state) => ({
          prompts: state.prompts.filter((p) => p.id !== id),
          defaultPromptId:
            state.defaultPromptId === id ? null : state.defaultPromptId,
          websitePromptSites: state.websitePromptSites.map((site) => ({
            ...site,
            rules: site.rules.filter((rule) => rule.promptId !== id),
          })),
        })),
      assignAppToPrompt: (promptId, appId) =>
        set((state) => ({
          prompts: state.prompts.map((p) => {
            if (p.id === promptId) {
              return {
                ...p,
                appIds: [...p.appIds.filter((id) => id !== appId), appId],
              };
            }
            return { ...p, appIds: p.appIds.filter((id) => id !== appId) };
          }),
        })),
      unassignApp: (appId) =>
        set((state) => ({
          prompts: state.prompts.map((p) => ({
            ...p,
            appIds: p.appIds.filter((id) => id !== appId),
          })),
        })),
      getPromptForApp: (appId) =>
        get().prompts.find((p) => p.appIds.includes(appId)),
      setDefaultPrompt: (id) => set({ defaultPromptId: id }),
      addWebsitePromptSite: () => {
        const id = crypto.randomUUID();
        set((state) => ({
          websitePromptSites: [
            ...state.websitePromptSites,
            {
              id,
              domain: "",
              iconSrc: null,
              iconStatus: "idle",
              rules: [],
            },
          ],
        }));
        return id;
      },
      updateWebsitePromptSite: (id, updates) =>
        set((state) => ({
          websitePromptSites: state.websitePromptSites.map((site) => {
            if (site.id !== id) return site;
            const nextDomain =
              updates.domain !== undefined
                ? normalizeDomainInput(updates.domain)
                : site.domain;
            const domainChanged =
              updates.domain !== undefined && nextDomain !== site.domain;
            return {
              ...site,
              ...updates,
              domain: nextDomain,
              iconSrc:
                domainChanged && updates.iconSrc === undefined
                  ? null
                  : (updates.iconSrc ?? site.iconSrc),
              iconStatus:
                updates.iconStatus ??
                (domainChanged ? "idle" : site.iconStatus),
              rules: sortWebsitePromptRules(
                site.rules.map((rule) =>
                  domainChanged
                    ? {
                        ...rule,
                        value: toStoredRuleValue(
                          rule.kind,
                          rule.value,
                          nextDomain,
                        ),
                      }
                    : rule,
                ),
              ),
            };
          }),
        })),
      removeWebsitePromptSite: (id) =>
        set((state) => ({
          websitePromptSites: state.websitePromptSites.filter(
            (site) => site.id !== id,
          ),
        })),
      addWebsitePromptSiteRule: (siteId, rule = {}) => {
        const ruleId = crypto.randomUUID();
        set((state) => ({
          websitePromptSites: state.websitePromptSites.map((site) => {
            if (site.id !== siteId) return site;
            const nextRule: WebsitePromptSiteRule = {
              id: ruleId,
              kind: rule.kind ?? "path-prefix",
              value: toStoredRuleValue(
                rule.kind ?? "path-prefix",
                rule.value ?? "",
                site.domain,
              ),
              promptId: rule.promptId?.trim() ?? "",
              label: rule.label ?? "",
            };
            return {
              ...site,
              rules: sortWebsitePromptRules([...site.rules, nextRule]),
            };
          }),
        }));
        return ruleId;
      },
      updateWebsitePromptSiteRule: (siteId, ruleId, updates) =>
        set((state) => ({
          websitePromptSites: state.websitePromptSites.map((site) => {
            if (site.id !== siteId) {
              return site;
            }

            const rules = site.rules.map((rule) => {
              if (rule.id !== ruleId) {
                return rule;
              }

              const nextKind = updates.kind ?? rule.kind;
              return {
                ...rule,
                ...updates,
                kind: nextKind,
                label: updates.label !== undefined ? updates.label : rule.label,
                promptId:
                  updates.promptId !== undefined
                    ? updates.promptId.trim()
                    : rule.promptId,
                value:
                  updates.value !== undefined || updates.kind !== undefined
                    ? toStoredRuleValue(
                        nextKind,
                        updates.value ?? rule.value,
                        site.domain,
                      )
                    : rule.value,
              };
            });

            return { ...site, rules: sortWebsitePromptRules(rules) };
          }),
        })),
      removeWebsitePromptSiteRule: (siteId, ruleId) =>
        set((state) => ({
          websitePromptSites: state.websitePromptSites.map((site) =>
            site.id === siteId
              ? {
                  ...site,
                  rules: site.rules.filter((rule) => rule.id !== ruleId),
                }
              : site,
          ),
        })),
      fetchWebsitePromptSiteIcon: async (siteId, fetcher) => {
        const site = get().websitePromptSites.find(
          (item) => item.id === siteId,
        );
        if (!site?.domain || !fetcher) {
          return;
        }

        set((state) => ({
          websitePromptSites: state.websitePromptSites.map((item) =>
            item.id === siteId ? { ...item, iconStatus: "loading" } : item,
          ),
        }));

        try {
          const iconSrc = await fetcher(site.domain);
          set((state) => ({
            websitePromptSites: state.websitePromptSites.map((item) =>
              item.id === siteId
                ? {
                    ...item,
                    iconSrc,
                    iconStatus: iconSrc ? "ready" : "error",
                  }
                : item,
            ),
          }));
        } catch {
          set((state) => ({
            websitePromptSites: state.websitePromptSites.map((item) =>
              item.id === siteId
                ? { ...item, iconSrc: null, iconStatus: "error" }
                : item,
            ),
          }));
        }
      },
      resolvePromptForHotkey: (appId, pageUrl) => {
        const state = get();
        const normalizedPageUrl = pageUrl?.trim() || null;

        const defaultPrompt = state.defaultPromptId
          ? state.prompts.find((p) => p.id === state.defaultPromptId)
          : undefined;
        const builtinPrompt = state.prompts.find((p) => p.id === "formal");
        const firstPrompt = state.prompts[0];

        const withResolution = (
          prompt: Prompt | undefined,
          source: PromptSource,
          matchedWebsitePattern: string | null = null,
        ): PromptResolution | undefined =>
          prompt
            ? {
                prompt,
                source,
                pageUrl: normalizedPageUrl,
                matchedWebsitePattern,
              }
            : undefined;

        if (normalizedPageUrl) {
          const websiteMatch = pickWebsitePromptMatch(
            state.websitePromptSites,
            normalizedPageUrl,
          );
          if (websiteMatch) {
            const found = state.prompts.find(
              (p) => p.id === websiteMatch.promptId,
            );
            if (found) {
              return withResolution(
                found,
                "website",
                websiteMatch.matchedWebsitePattern,
              );
            }
          }
        }

        return (
          withResolution(state.getPromptForApp(appId), "app") ??
          withResolution(defaultPrompt, "default") ??
          withResolution(builtinPrompt, "builtin") ??
          withResolution(firstPrompt, "builtin")
        );
      },
    }),
    {
      name: "raypaste-prompts",
      merge: (persisted, current) => {
        const p = (persisted as PersistedPromptsState | undefined) ?? {};
        const websitePromptSites = (
          p.websitePromptSites?.length ? p.websitePromptSites : []
        )
          .map((site) => normalizeWebsitePromptSite(site) ?? site)
          .filter((site) => site.domain || site.rules.length > 0);

        return {
          ...current,
          ...p,
          websitePromptSites,
        };
      },
    },
  ),
);

export {
  extractDomainFromPattern,
  normalizeDomainInput,
  normalizePathPrefixInput,
  pickWebsitePromptMatch,
};
