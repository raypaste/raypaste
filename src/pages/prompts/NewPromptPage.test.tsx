import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NewPromptPage } from "./NewPromptPage";
import { usePromptsStore } from "#/stores";

vi.mock("#/pages/prompts/PromptAppSelector", () => ({
  PromptAppSelector: () => <div data-testid="prompt-app-selector" />,
}));

vi.mock("#/services/websiteIcons", () => ({
  fetchWebsiteIcon: vi.fn().mockResolvedValue(null),
}));

const FORMAL = {
  id: "formal",
  name: "Formal",
  text: "Make this text more formal",
  notes: "",
  appIds: [] as string[],
  websitePromptSiteIds: [] as string[],
};

function resetStore() {
  usePromptsStore.setState({
    prompts: [FORMAL],
    defaultPromptId: null,
    websitePromptSites: [],
  });
}

describe("NewPromptPage", () => {
  beforeEach(() => {
    localStorage.clear();
    resetStore();
  });

  it("creates a new prompt and website site-wide mapping from the form", async () => {
    const user = userEvent.setup();
    const onCreated = vi.fn();

    render(<NewPromptPage onCreated={onCreated} />);

    await user.type(
      screen.getByPlaceholderText(/prompt name/i),
      "GitHub workflow",
    );
    await user.type(
      screen.getByPlaceholderText(/describe what you want the ai to do/i),
      "Do the work",
    );
    await user.click(screen.getByLabelText(/connect website/i));
    await user.type(screen.getByPlaceholderText("example.com"), "github.com");
    await user.click(screen.getByRole("button", { name: /save prompt/i }));

    const state = usePromptsStore.getState();
    const created = state.prompts.find(
      (prompt) => prompt.name === "GitHub workflow",
    );
    expect(created).toBeTruthy();
    expect(onCreated).toHaveBeenCalledWith(created?.id);
    expect(state.websitePromptSites).toHaveLength(1);
    expect(state.websitePromptSites[0]?.domain).toBe("github.com");
    expect(state.websitePromptSites[0]?.rules).toEqual([
      expect.objectContaining({
        kind: "site",
        promptId: created?.id,
      }),
    ]);
  });

  it("prefills from website prompts and attaches the saved prompt to the existing rule", async () => {
    const user = userEvent.setup();
    usePromptsStore.setState({
      websitePromptSites: [
        {
          id: "site-1",
          domain: "github.com",
          iconSrc: null,
          iconStatus: "idle",
          rules: [
            {
              id: "rule-1",
              kind: "site",
              value: "",
              promptId: "",
              label: "",
            },
          ],
        },
      ],
    });

    render(
      <NewPromptPage
        onCreated={vi.fn()}
        prefill={{
          website: {
            enabled: true,
            siteId: "site-1",
            ruleId: "rule-1",
            domain: "github.com",
            ruleKind: "site",
          },
        }}
      />,
    );

    expect(screen.getByDisplayValue("Github")).toBeInTheDocument();
    expect(screen.getByDisplayValue("github.com")).toBeInTheDocument();

    await user.type(
      screen.getByPlaceholderText(/describe what you want the ai to do/i),
      "Handle issues",
    );
    await user.click(screen.getByRole("button", { name: /save prompt/i }));

    const state = usePromptsStore.getState();
    const created = state.prompts.find((prompt) => prompt.name === "Github");
    expect(created).toBeTruthy();
    expect(state.websitePromptSites[0]?.rules[0]).toEqual(
      expect.objectContaining({
        id: "rule-1",
        promptId: created?.id,
      }),
    );
  });
});
