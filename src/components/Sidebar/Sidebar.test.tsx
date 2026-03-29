import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Sidebar } from "./Sidebar";
import { useAppsStore, usePromptsStore } from "#/stores";

vi.mock("#/hooks/useAppIcons", () => ({
  useAppIcons: () => ({}),
}));

describe("Sidebar", () => {
  beforeEach(() => {
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

  it("renders settings nav and compact prompts mode on settings pages", () => {
    render(
      <Sidebar
        activePage="settings"
        activeSettingsSubpage="general"
        selectedPromptId={null}
        selectedWebsitePromptSiteId={null}
        onNavigate={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("navigation", { name: /settings sections/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("General")).toBeInTheDocument();
    expect(screen.getByText("AI")).toBeInTheDocument();
    expect(screen.getByText("Data & Apps")).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: /search prompts/i }),
    ).toBeInTheDocument();
  });

  it("navigates between settings subpages from the settings nav", async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();

    render(
      <Sidebar
        activePage="settings"
        activeSettingsSubpage="general"
        selectedPromptId={null}
        selectedWebsitePromptSiteId={null}
        onNavigate={onNavigate}
      />,
    );

    await user.click(screen.getByRole("button", { name: /ai/i }));

    expect(onNavigate).toHaveBeenCalledWith(
      "settings",
      undefined,
      undefined,
      "ai",
    );
  });

  it("keeps the full prompts search UI outside settings", () => {
    render(
      <Sidebar
        activePage="new-prompt"
        activeSettingsSubpage="general"
        selectedPromptId={null}
        selectedWebsitePromptSiteId={null}
        onNavigate={vi.fn()}
      />,
    );

    expect(
      screen.queryByRole("navigation", { name: /settings sections/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: /search prompts/i }),
    ).toBeInTheDocument();
  });
});
