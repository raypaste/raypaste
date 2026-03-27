import { useEffect } from "react";

import { useSettingsStore, type ThemeMode } from "#/stores";

/** Sets `html` light/dark from settings (overlay webviews never mount `<App />`). */
export function useApplyDocumentTheme() {
  const themeMode = useSettingsStore((s) => s.themeMode);

  useEffect(() => {
    const apply = (mode: ThemeMode) => {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      const resolved =
        mode === "auto" ? (prefersDark ? "dark" : "light") : mode;
      document.documentElement.classList.remove("light", "dark");
      document.documentElement.classList.add(resolved);
      document.documentElement.style.colorScheme = resolved;
    };

    apply(themeMode);

    if (themeMode !== "auto") {
      return;
    }

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => apply("auto");
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [themeMode]);
}
