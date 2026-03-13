import { useEffect } from "react";
import "#/App.css";
import { Layout } from "#/components/Layout";
import { useSettingsStore } from "#/stores";

function App() {
  const themeMode = useSettingsStore((s) => s.themeMode);

  useEffect(() => {
    const apply = (mode: typeof themeMode) => {
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

    if (themeMode !== "auto") return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => apply("auto");
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [themeMode]);

  return <Layout />;
}

export default App;
