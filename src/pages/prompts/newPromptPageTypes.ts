import { capitalizeFirstLetter } from "#/lib/strings";
import type { WebsitePromptSiteRule } from "#/stores";
import { normalizeDomainInput } from "#/stores/promptsStore";

export interface NewPromptPageWebsitePrefill {
  enabled?: boolean;
  siteId?: string | null;
  ruleId?: string | null;
  domain?: string;
  ruleKind?: WebsitePromptSiteRule["kind"];
  pathPrefix?: string;
}

export interface NewPromptPagePrefill {
  name?: string;
  text?: string;
  notes?: string;
  selectedAppIds?: string[];
  website?: NewPromptPageWebsitePrefill | null;
}

export function suggestPromptNameFromDomain(domain: string): string {
  const normalized = normalizeDomainInput(domain);
  if (!normalized) {
    return "";
  }

  const labels = normalized.split(".").filter(Boolean);
  if (labels.length <= 1) {
    return capitalizeFirstLetter(normalized);
  }

  const stem = [...labels];
  stem.pop();
  const lastLabel = labels[labels.length - 1];
  const penultimateStemLabel = stem[stem.length - 1];
  if (
    lastLabel?.length === 2 &&
    stem.length > 1 &&
    (penultimateStemLabel?.length ?? 0) <= 3
  ) {
    stem.pop();
  }

  return (
    capitalizeFirstLetter(stem.join(" ").replace(/[-_]+/g, " ").trim()) ||
    normalized
  );
}
