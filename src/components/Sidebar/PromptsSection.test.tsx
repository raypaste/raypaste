import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PromptsSection } from "./PromptsSection";
import { usePromptsStore, useAppsStore } from "#/stores";
import { recomputePromptWebsiteSiteIds } from "#/stores/promptsStore";

vi.mock("#/hooks/useAppIcons", () => ({
  useAppIcons: () => ({}),
}));

describe("PromptsSection", () => {
  beforeEach(() => {
    usePromptsStore.setState({
      prompts: [
        {
          id: "formal",
          name: "Formal",
          text: "x",
          notes: "",
          appIds: [],
          websitePromptSiteIds: [],
        },
        {
          id: "u1",
          name: "Unassigned Only",
          text: "a",
          notes: "",
          appIds: [],
          websitePromptSiteIds: [],
        },
        {
          id: "assigned",
          name: "In Safari",
          text: "b",
          notes: "",
          appIds: ["com.apple.Safari"],
          websitePromptSiteIds: [],
        },
      ],
      defaultPromptId: null,
      websitePromptSites: [
        {
          id: "ws1",
          domain: "news.com",
          iconSrc: null,
          iconStatus: "idle",
          rules: [
            {
              id: "r1",
              kind: "site",
              value: "",
              promptId: "formal",
              label: "",
            },
          ],
        },
      ],
    });
    usePromptsStore.setState((s) => ({
      prompts: recomputePromptWebsiteSiteIds(s.prompts, s.websitePromptSites),
    }));
    useAppsStore.setState({
      apps: [
        { name: "Safari", bundleId: "com.apple.Safari" },
        { name: "Notes", bundleId: "com.apple.Notes" },
      ],
      activeApp: null,
    });
  });

  it("shows Unassigned only for prompts with no app and no website link", async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    render(
      <PromptsSection
        activePage="prompt"
        selectedPromptId={null}
        selectedWebsitePromptSiteId={null}
        onNavigate={onNavigate}
      />,
    );

    await user.click(screen.getByText("Unassigned"));
    // Only prompts with no app mapping and no website rule appear here (u1).
    // "Formal" is linked to news.com; "In Safari" is under the Safari app group.
    expect(screen.getByText("Unassigned Only")).toBeInTheDocument();
  });

  it("navigates to prompt when an item is clicked", async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    render(
      <PromptsSection
        activePage="prompt"
        selectedPromptId={null}
        selectedWebsitePromptSiteId={null}
        onNavigate={onNavigate}
      />,
    );

    await user.click(screen.getByText("Unassigned"));
    await user.click(screen.getByText("Unassigned Only"));
    expect(onNavigate).toHaveBeenCalledWith("prompt", "u1");
  });
});
