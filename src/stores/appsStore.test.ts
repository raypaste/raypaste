import { describe, it, expect, beforeEach, vi } from "vitest";
import { useAppsStore } from "./appsStore";

function resetAppsStore() {
  useAppsStore.setState({
    apps: [],
    activeApp: null,
    hiddenAppBundleIds: [],
  });
}

describe("useAppsStore", () => {
  beforeEach(() => {
    localStorage.clear();
    resetAppsStore();
    vi.spyOn(useAppsStore.persist, "rehydrate").mockResolvedValue(undefined);
  });

  it("hideApp appends a bundle id once", () => {
    useAppsStore.getState().hideApp("com.example.a");
    useAppsStore.getState().hideApp("com.example.a");
    expect(useAppsStore.getState().hiddenAppBundleIds).toEqual([
      "com.example.a",
    ]);
  });

  it("unhideApp removes a bundle id", () => {
    useAppsStore.setState({
      hiddenAppBundleIds: ["com.example.a", "com.example.b"],
    });
    useAppsStore.getState().unhideApp("com.example.a");
    expect(useAppsStore.getState().hiddenAppBundleIds).toEqual([
      "com.example.b",
    ]);
  });

  it("setApps prunes hidden ids that are not in the new app list", () => {
    useAppsStore.setState({
      apps: [{ name: "Keep", bundleId: "com.keep" }],
      hiddenAppBundleIds: ["com.keep", "com.uninstalled"],
    });
    useAppsStore.getState().setApps([{ name: "Other", bundleId: "com.other" }]);
    expect(useAppsStore.getState().apps).toEqual([
      { name: "Other", bundleId: "com.other" },
    ]);
    expect(useAppsStore.getState().hiddenAppBundleIds).toEqual([]);
  });
});
