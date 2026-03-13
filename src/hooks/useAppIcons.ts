import { useState, useEffect, useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { InstalledApp } from "#/stores";

async function loadIconSrc(app: InstalledApp): Promise<string | null> {
  if (app.iconPath) {
    return invoke<string | null>("get_icon_base64", {
      request: { path: app.iconPath },
    });
  }
  if (app.icnsPath) {
    return invoke<string | null>("get_icon_base64_for_icns", {
      icnsPath: app.icnsPath,
    });
  }
  return null;
}

async function withConcurrencyLimit<T>(
  tasks: (() => Promise<T>)[],
  limit: number,
): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let next = 0;
  async function worker() {
    while (next < tasks.length) {
      const i = next++;
      results[i] = await tasks[i]();
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(limit, tasks.length) }, worker),
  );
  return results;
}

/**
 * Loads base64 icon data URLs for a list of apps, handling both already-cached
 * (iconPath) and not-yet-converted (icnsPath) cases. Returns a map of
 * bundleId → data URL.
 */
export function useAppIcons(apps: InstalledApp[]): Record<string, string> {
  const [iconSrcByBundleId, setIconSrcByBundleId] = useState<
    Record<string, string>
  >({});

  // Stabilise the dependency: only re-run when the set of bundle IDs changes,
  // not on every new array reference.
  const appsKey = apps.map((a) => a.bundleId).join(",");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stableApps = useMemo(() => apps, [appsKey]);

  useEffect(() => {
    const appsNeedingIcons = stableApps.filter(
      (app) =>
        (app.iconPath || app.icnsPath) && !iconSrcByBundleId[app.bundleId],
    );
    if (appsNeedingIcons.length === 0) return;

    let cancelled = false;

    const tasks = appsNeedingIcons.map(
      (app) => () =>
        loadIconSrc(app).then((src): [string, string] | null =>
          src ? [app.bundleId, src] : null,
        ),
    );

    withConcurrencyLimit(tasks, 8)
      .then((results) => {
        if (cancelled) return;
        const entries = results.filter(
          (e): e is [string, string] => e !== null,
        );
        if (entries.length === 0) return;
        setIconSrcByBundleId((current) => ({
          ...current,
          ...Object.fromEntries(entries),
        }));
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [stableApps, iconSrcByBundleId]);

  return iconSrcByBundleId;
}
