import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { SettingsPage } from "./SettingsPage";
import { useAppsStore, usePromptsStore, useSettingsStore } from "#/stores";

vi.mock("#/hooks/useAppIcons", () => ({
  useAppIcons: () => ({}),
}));

describe("SettingsPage", () => {
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
      apps: [{ name: "Notes", bundleId: "com.apple.Notes" }],
      activeApp: null,
      hiddenAppBundleIds: ["com.apple.Notes"],
    });
  });

  it("renders the general settings subpage sections", () => {
    render(<SettingsPage activeSubpage="general" />);

    expect(
      screen.getByRole("heading", { name: "General" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Appearance")).toBeInTheDocument();
    expect(screen.getByText("Completion Mode")).toBeInTheDocument();
    expect(screen.getByText("Default Prompt")).toBeInTheDocument();
    expect(screen.queryByText("AI Source")).not.toBeInTheDocument();
  });

  it("renders the AI settings subpage sections", () => {
    render(<SettingsPage activeSubpage="ai" />);

    expect(screen.getByRole("heading", { name: "AI" })).toBeInTheDocument();
    expect(screen.getByText("AI Source")).toBeInTheDocument();
    expect(screen.getByText("Provider")).toBeInTheDocument();
    expect(screen.getByText("Model")).toBeInTheDocument();
    expect(screen.queryByText("Hidden Apps")).not.toBeInTheDocument();
  });

  it("renders the data and apps settings subpage sections", () => {
    render(<SettingsPage activeSubpage="data-apps" />);

    expect(
      screen.getByRole("heading", { name: "Data & Apps" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Import & Export")).toBeInTheDocument();
    expect(screen.getByText("Hidden Apps")).toBeInTheDocument();
    expect(screen.queryByText("Appearance")).not.toBeInTheDocument();
  });
});
