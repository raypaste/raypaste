import type { Prompt, WebsitePromptSite } from "#/stores/promptsStore";
import type { InstalledApp } from "#/stores/appsStore";

export type PromptSearchRow = {
  id: string;
  promptName: string;
  contextLabel: string;
};

type PromptSearchIndexRow = PromptSearchRow & {
  searchFields: string[];
};

function tokenizeQuery(q: string): string[] {
  return q.trim().toLowerCase().split(/\s+/).filter(Boolean);
}

/**
 * Score a single token against haystack. Higher is better; null if no fuzzy match.
 * Prefers contiguous substring hits, then ordered subsequence (gap-tolerant).
 */
function scoreToken(haystack: string, token: string): number | null {
  const h = haystack.toLowerCase();
  const t = token;
  if (!t) return 0;

  const sub = h.indexOf(t);
  if (sub !== -1) {
    return 2000 - sub - t.length * 0.02;
  }

  let hi = 0;
  let penalty = 0;
  for (let i = 0; i < t.length; i++) {
    const pos = h.indexOf(t[i]!, hi);
    if (pos === -1) return null;
    penalty += pos;
    hi = pos + 1;
  }
  return 400 - penalty / Math.max(t.length, 1);
}

function scoreTokenAcrossFields(
  fields: string[],
  token: string,
): number | null {
  let best: number | null = null;
  for (const f of fields) {
    if (!f) continue;
    const s = scoreToken(f, token);
    if (s !== null && (best === null || s > best)) best = s;
  }
  return best;
}

function scoreQueryAgainstFields(
  fields: string[],
  query: string,
): number | null {
  const tokens = tokenizeQuery(query);
  if (tokens.length === 0) return 0;
  let total = 0;
  for (const tok of tokens) {
    const s = scoreTokenAcrossFields(fields, tok);
    if (s === null) return null;
    total += s;
  }
  return total;
}

/** Full domain plus host-style variants (e.g. github from api.github.com). */
function domainSearchVariants(domain: string): string[] {
  const d = domain.trim().toLowerCase();
  if (!d) return [];
  const parts = d.split(".").filter(Boolean);
  const out = new Set<string>([d]);
  if (parts.length >= 2) {
    out.add(parts.slice(-2).join("."));
    out.add(parts[parts.length - 2]!);
  }
  return [...out];
}

export function buildPromptSearchIndex(
  prompts: Prompt[],
  apps: InstalledApp[],
  websitePromptSites: WebsitePromptSite[],
): PromptSearchIndexRow[] {
  const bundleToName = new Map(apps.map((a) => [a.bundleId, a.name] as const));
  const siteIdToSite = new Map(
    websitePromptSites.map((s) => [s.id, s] as const),
  );

  return prompts.map((p) => {
    const appNames = p.appIds
      .map((id) => bundleToName.get(id))
      .filter((n): n is string => Boolean(n));
    const domains: string[] = [];
    for (const sid of p.websitePromptSiteIds) {
      const site = siteIdToSite.get(sid);
      if (!site?.domain) continue;
      domains.push(...domainSearchVariants(site.domain));
    }

    const parts: string[] = [];
    if (appNames.length) parts.push(appNames.join(", "));
    if (p.websitePromptSiteIds.length) {
      const labels = p.websitePromptSiteIds
        .map((id) => siteIdToSite.get(id)?.domain)
        .filter((d): d is string => Boolean(d));
      if (labels.length) parts.push(labels.join(", "));
    }
    const contextLabel = parts.length ? parts.join(" · ") : "Unassigned";

    return {
      id: p.id,
      promptName: p.name,
      contextLabel,
      searchFields: [p.name, ...appNames, ...domains, contextLabel],
    };
  });
}

export function filterAndSortPromptsByFuzzyQuery(
  rows: PromptSearchIndexRow[],
  query: string,
): PromptSearchRow[] {
  const q = query.trim();
  if (!q) {
    return rows.map(({ id, promptName, contextLabel }) => ({
      id,
      promptName,
      contextLabel,
    }));
  }

  const scored: { row: PromptSearchRow; score: number }[] = [];
  for (const r of rows) {
    const s = scoreQueryAgainstFields(r.searchFields, q);
    if (s !== null) {
      scored.push({
        row: {
          id: r.id,
          promptName: r.promptName,
          contextLabel: r.contextLabel,
        },
        score: s,
      });
    }
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.map((x) => x.row);
}
