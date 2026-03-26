import { vi } from "vitest";

/**
 * Shared Tauri API mocks for unit tests. Import and spread into vi.mock() factories as needed.
 */
export function createMockInvoke() {
  return vi.fn().mockResolvedValue(undefined);
}

export function createMockEmit() {
  return vi.fn().mockResolvedValue(undefined);
}

export function createMockListen() {
  return vi.fn().mockResolvedValue(() => {});
}

export function createMockWebviewWindow() {
  return vi.fn().mockImplementation(() => ({
    close: vi.fn().mockResolvedValue(undefined),
    once: vi.fn(),
  }));
}
