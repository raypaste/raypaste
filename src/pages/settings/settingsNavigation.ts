export type SettingsSubpage = "general" | "ai" | "data-apps";

export interface SettingsNavItem {
  id: SettingsSubpage;
  label: string;
  description: string;
}

export const SETTINGS_NAV_ITEMS: SettingsNavItem[] = [
  {
    id: "general",
    label: "General",
    description: "Appearance, completion mode, and default prompt",
  },
  {
    id: "ai",
    label: "AI",
    description: "Provider, API key, and model",
  },
  {
    id: "data-apps",
    label: "Data & Apps",
    description: "Import/export and hidden apps",
  },
];

export const DEFAULT_SETTINGS_SUBPAGE: SettingsSubpage = "general";

export function getSettingsSubpageLabel(subpage: SettingsSubpage): string {
  return (
    SETTINGS_NAV_ITEMS.find((item) => item.id === subpage)?.label ?? "Settings"
  );
}
