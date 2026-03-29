import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useAppsStore, usePromptsStore, useSettingsStore } from "#/stores";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn().mockResolvedValue([]),
}));

vi.mock("#/hooks/useAICompletionListener", () => ({
  useAICompletionListener: () => {},
}));

vi.mock("#/hooks/useAppIcons", () => ({
  useAppIcons: () => ({}),
}));

vi.mock("#/pages/prompts/NewPromptPage", () => ({
  NewPromptPage: () => <div>New Prompt Page</div>,
}));

vi.mock("#/pages/prompts/PromptPage", () => ({
  PromptPage: () => <div>Prompt Page</div>,
}));

vi.mock("#/pages/apps/AppsPage", () => ({
  AppsPage: ({
    onNavigateToSettings,
  }: {
    onNavigateToSettings?: () => void;
  }) => (
    <button type="button" onClick={onNavigateToSettings}>
      Open Settings
    </button>
  ),
}));

vi.mock("#/pages/history/HistoryPage", () => ({
  HistoryPage: () => <div>History Page</div>,
}));

vi.mock("#/pages/website-prompts/WebsitePromptsPage", () => ({
  WebsitePromptsPage: () => <div>Website Prompts Page</div>,
}));

import { Layout } from "./Layout";

describe("Layout", () => {
  beforeEach(() => {
    useSettingsStore.setState({
      mode: "direct",
      provider: "openrouter",
      openrouterApiKey: "",
      cerebrasApiKey: "",
      model: "openai/gpt-oss-120b",
      reviewMode: false,
      themeMode: "auto",
    });
    usePromptsStore.setState({
      prompts: [
        {
          id: "p1",
          name: "Formal",
          text: "x",
          notes: "",
          appIds: [],
          websitePromptSiteIds: [],
        },
      ],
      defaultPromptId: null,
      websitePromptSites: [],
    });
    useAppsStore.setState({
      apps: [],
      activeApp: null,
      hiddenAppBundleIds: [],
    });
  });

  it("lands on the general settings subpage from the sidebar settings button", async () => {
    const user = userEvent.setup();
    render(<Layout />);

    await user.click(screen.getByRole("button", { name: /^settings$/i }));

    expect(
      screen.getByRole("heading", { level: 1, name: "General" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "General" }),
    ).toBeInTheDocument();
  });

  it("updates the page title when changing settings subpages", async () => {
    const user = userEvent.setup();
    render(<Layout />);

    await user.click(screen.getByRole("button", { name: /^settings$/i }));
    await user.click(screen.getByRole("button", { name: /data & apps/i }));

    expect(
      screen.getByRole("heading", { level: 1, name: "Data & Apps" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "Data & Apps" }),
    ).toBeInTheDocument();
  });
});
