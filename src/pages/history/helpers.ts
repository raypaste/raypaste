import type { UsageStatsRow } from "#/services/db";
import type { WebsitePromptSite } from "#/stores";

/** Resolves a website prompt site id from persisted completion fields (for deep-linking). */
export function findWebsiteSiteIdForCompletion(
  sites: WebsitePromptSite[],
  matchedPattern: string | null | undefined,
  promptId: string,
): string | null {
  if (!matchedPattern) {
    return null;
  }
  for (const site of sites) {
    for (const rule of site.rules) {
      if (rule.promptId !== promptId) {
        continue;
      }
      if (rule.kind === "path-prefix" && rule.value === matchedPattern) {
        return site.id;
      }
      if (rule.kind === "site" && site.domain === matchedPattern) {
        return site.id;
      }
    }
  }
  return null;
}

/** Full label for history UI (e.g. "Website prompt"). */
export function promptSourceDisplayLabel(
  source: string | null | undefined,
): string | null {
  switch (source) {
    case "website":
      return "Website prompt";
    case "app":
      return "App prompt";
    case "default":
      return "Default prompt";
    case "builtin":
      return "Built-in prompt";
    default:
      return null;
  }
}

export function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60_000);

  if (mins < 1) {
    return "just now";
  }

  if (mins < 60) {
    return `${mins}m ago`;
  }
  const hours = Math.floor(mins / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }
  const days = Math.floor(hours / 24);
  if (days === 1) {
    return "1 day ago";
  }
  if (days < 30) {
    return `${days} days ago`;
  }

  const months = Math.floor(days / 30);

  return months === 1 ? "1 month ago" : `${months} months ago`;
}

export function avgTokPerSec(stats: UsageStatsRow): string {
  if (!stats.totalCompletionMs) {
    return "—";
  }

  return ((stats.totalOutputTokens / stats.totalCompletionMs) * 1000).toFixed(
    1,
  );
}

export function avgCompletionTime(stats: UsageStatsRow): string {
  if (!stats.totalCompletions) {
    return "—";
  }

  return (
    (stats.totalCompletionMs / stats.totalCompletions / 1000).toFixed(2) + "s"
  );
}

export function appColor(str: string): string {
  let hash = 0;
  for (const ch of str) {
    hash = ch.charCodeAt(0) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;

  return `hsl(${h},38%,36%)`;
}
