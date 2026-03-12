import type { UsageStatsRow } from "#/services/db";

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
