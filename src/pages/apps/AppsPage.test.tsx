import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppsPage } from "./AppsPage";
import { useAppsStore, usePromptsStore } from "#/stores";

vi.mock("#/hooks/useAppIcons", () => ({
  useAppIcons: () => ({}),
}));

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

const formalPrompt = {
  id: "formal",
  name: "Formal",
  text: "Make this text more formal",
  notes: "",
  appIds: [] as string[],
  websitePromptSiteIds: [] as string[],
};

function resetStores() {
  useAppsStore.setState({
    apps: [],
    activeApp: null,
    hiddenAppBundleIds: [],
  });
  usePromptsStore.setState({
    prompts: [formalPrompt],
    defaultPromptId: null,
    websitePromptSites: [],
  });
}

describe("AppsPage", () => {
  beforeEach(() => {
    localStorage.clear();
    resetStores();
    vi.spyOn(useAppsStore.persist, "rehydrate").mockResolvedValue(undefined);
    vi.spyOn(usePromptsStore.persist, "rehydrate").mockResolvedValue(undefined);
  });

  it("does not list apps marked hidden", () => {
    useAppsStore.setState({
      apps: [
        { name: "Visible App", bundleId: "com.visible" },
        { name: "Hidden App", bundleId: "com.hidden" },
      ],
      hiddenAppBundleIds: ["com.hidden"],
    });

    render(<AppsPage onNavigateToSettings={() => {}} />);

    expect(screen.getByText("Visible App")).toBeInTheDocument();
    expect(screen.queryByText("Hidden App")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /view hidden apps/i }),
    ).toBeInTheDocument();
  });

  it("hides an app from the menu", async () => {
    const user = userEvent.setup();
    useAppsStore.setState({
      apps: [
        { name: "Notes", bundleId: "com.apple.Notes" },
        { name: "Mail", bundleId: "com.apple.mail" },
      ],
    });

    render(<AppsPage />);

    const notesRow = screen.getByText("Notes").closest("div.rounded-xl");
    expect(notesRow).toBeTruthy();
    const menuTrigger = within(notesRow as HTMLElement).getByRole("button", {
      name: /open menu for notes/i,
    });
    await user.click(menuTrigger);
    const hideItem = await screen.findByText("Hide app");
    await user.click(hideItem);

    await waitFor(() => {
      expect(screen.queryByText("Notes")).not.toBeInTheDocument();
    });
    expect(screen.getByText("Mail")).toBeInTheDocument();
    expect(useAppsStore.getState().hiddenAppBundleIds).toContain(
      "com.apple.Notes",
    );
    expect(
      screen.getByRole("button", { name: /view hidden apps/i }),
    ).toBeInTheDocument();
  });
});
