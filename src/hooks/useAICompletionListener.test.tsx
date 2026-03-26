import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useAICompletionListener } from "./useAICompletionListener";
import { usePromptsStore, useSettingsStore } from "#/stores";
import { getApiKey } from "#/services/llm";
import { showToastOverlay } from "#/services/overlayWindows";

const listeners = vi.hoisted(
  () => new Map<string, (e: { payload: unknown }) => void>(),
);
const runReviewMode = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const runInstantMode = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));

vi.mock("@tauri-apps/api/event", () => ({
  listen: (event: string, handler: (e: { payload: unknown }) => void) => {
    listeners.set(event, handler);
    return Promise.resolve(() => {});
  },
  emit: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("#/lib/core/reviewMode", () => ({
  runReviewMode: (...args: unknown[]) => runReviewMode(...args),
}));

vi.mock("#/lib/core/instantMode", () => ({
  runInstantMode: (...args: unknown[]) => runInstantMode(...args),
}));

vi.mock("#/services/llm", () => ({
  getApiKey: vi.fn(() => "test-api-key"),
}));

vi.mock("#/services/overlayWindows", () => ({
  showToastOverlay: vi.fn(),
}));

vi.mock("#/services/db", () => ({
  updateCompletionOutcome: vi.fn().mockResolvedValue(undefined),
}));

describe("useAICompletionListener", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listeners.clear();
    localStorage.clear();
    usePromptsStore.setState({
      prompts: [
        {
          id: "formal",
          name: "Formal",
          text: "Make this text more formal",
          notes: "",
          appIds: [],
          websitePromptSiteIds: [],
        },
      ],
      defaultPromptId: null,
      websitePromptSites: [],
    });
    useSettingsStore.setState({
      reviewMode: false,
      model: "m",
      provider: "openrouter" as const,
    });
    vi.spyOn(useSettingsStore.persist, "rehydrate").mockResolvedValue(
      undefined,
    );
  });

  it("runs instant mode when review mode is off", async () => {
    renderHook(() => useAICompletionListener());

    await waitFor(() =>
      expect(listeners.has("raypaste://hotkey-triggered")).toBe(true),
    );

    listeners.get("raypaste://hotkey-triggered")!({
      payload: {
        app: "com.apple.Notes",
        selected_text: "hello",
        target_pid: 1,
        page_url: null,
      },
    });

    await waitFor(() => expect(runInstantMode).toHaveBeenCalled());
    expect(runReviewMode).not.toHaveBeenCalled();
  });

  it("shows error toast when no text selected", async () => {
    renderHook(() => useAICompletionListener());

    await waitFor(() =>
      expect(listeners.has("raypaste://hotkey-triggered")).toBe(true),
    );

    listeners.get("raypaste://hotkey-triggered")!({
      payload: {
        app: "com.apple.Notes",
        selected_text: "   ",
        target_pid: 1,
      },
    });

    await waitFor(() =>
      expect(showToastOverlay).toHaveBeenCalledWith(
        "No text selected. Select some text and try again.",
        "error",
      ),
    );
    expect(runInstantMode).not.toHaveBeenCalled();
  });

  it("shows browser fallback info toast once per app when website prompts exist but page_url is missing", async () => {
    usePromptsStore.setState({
      websitePromptSites: [
        {
          id: "s1",
          domain: "x.com",
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

    renderHook(() => useAICompletionListener());

    await waitFor(() =>
      expect(listeners.has("raypaste://hotkey-triggered")).toBe(true),
    );

    const fire = () =>
      listeners.get("raypaste://hotkey-triggered")!({
        payload: {
          app: "com.apple.Safari",
          selected_text: "hi",
          target_pid: 2,
          page_url: null,
        },
      });

    fire();
    await waitFor(() =>
      expect(showToastOverlay).toHaveBeenCalledWith(
        "Website prompts were unavailable for this tab, so Raypaste used your usual fallback prompt.",
        "info",
        4200,
      ),
    );

    vi.mocked(showToastOverlay).mockClear();
    fire();
    expect(showToastOverlay).not.toHaveBeenCalled();
  });

  it("shows error when no API key", async () => {
    vi.mocked(getApiKey).mockReturnValueOnce("");

    renderHook(() => useAICompletionListener());

    await waitFor(() =>
      expect(listeners.has("raypaste://hotkey-triggered")).toBe(true),
    );

    listeners.get("raypaste://hotkey-triggered")!({
      payload: {
        app: "com.apple.Notes",
        selected_text: "hello",
        target_pid: 1,
      },
    });

    await waitFor(() =>
      expect(showToastOverlay).toHaveBeenCalledWith(
        "No API key set. Go to Settings to add one.",
        "error",
      ),
    );
    expect(runInstantMode).not.toHaveBeenCalled();
  });
});
