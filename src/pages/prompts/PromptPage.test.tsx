import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PromptPage } from "./PromptPage";
import { usePromptsStore } from "#/stores";

vi.mock("#/pages/prompts/PromptAppSelector", () => ({
  PromptAppSelector: () => <div data-testid="prompt-app-selector" />,
}));

const FORMAL = {
  id: "formal",
  name: "Formal",
  text: "Make this text more formal",
  notes: "",
  appIds: [] as string[],
  websitePromptSiteIds: [] as string[],
};

function seedStore() {
  usePromptsStore.setState({
    prompts: [
      FORMAL,
      {
        id: "edit-me",
        name: "My Prompt",
        text: "Body",
        notes: "",
        appIds: [],
        websitePromptSiteIds: [],
      },
    ],
    defaultPromptId: null,
    websitePromptSites: [],
  });
}

describe("PromptPage", () => {
  beforeEach(() => {
    seedStore();
  });

  it("confirm-delete calls deletePrompt and onDeleted", async () => {
    const user = userEvent.setup();
    const onDeleted = vi.fn();
    render(
      <PromptPage
        promptId="edit-me"
        onDeleted={onDeleted}
        onNavigateToWebsitePromptSite={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: /delete prompt/i }));
    await user.click(
      screen.getByRole("button", { name: /click again to confirm delete/i }),
    );

    expect(
      usePromptsStore.getState().prompts.some((p) => p.id === "edit-me"),
    ).toBe(false);
    expect(onDeleted).toHaveBeenCalledTimes(1);
  });

  it("lists website rules as buttons that call onNavigateToWebsitePromptSite", async () => {
    const user = userEvent.setup();
    const onNav = vi.fn();
    usePromptsStore.setState({
      websitePromptSites: [
        {
          id: "site-a",
          domain: "example.com",
          iconSrc: null,
          iconStatus: "idle",
          rules: [
            {
              id: "rule-1",
              kind: "site",
              value: "",
              promptId: "edit-me",
              label: "",
            },
          ],
        },
      ],
    });
    usePromptsStore.setState((s) => ({
      prompts: s.prompts.map((p) =>
        p.id === "edit-me" ? { ...p, websitePromptSiteIds: ["site-a"] } : p,
      ),
    }));

    render(
      <PromptPage
        promptId="edit-me"
        onDeleted={vi.fn()}
        onNavigateToWebsitePromptSite={onNav}
      />,
    );

    await user.click(screen.getByRole("button", { name: "example.com" }));
    expect(onNav).toHaveBeenCalledWith("site-a");
  });
});
