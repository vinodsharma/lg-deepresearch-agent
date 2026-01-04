import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock zustand persist middleware
vi.mock("zustand/middleware", () => ({
  persist: (fn: unknown) => fn,
}));

describe("useAuthStore", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("should initialize with null apiKey", async () => {
    const { useAuthStore } = await import("./auth-store");
    const state = useAuthStore.getState();
    expect(state.apiKey).toBeNull();
  });

  it("should set apiKey", async () => {
    const { useAuthStore } = await import("./auth-store");
    useAuthStore.getState().setApiKey("test-api-key");
    expect(useAuthStore.getState().apiKey).toBe("test-api-key");
  });

  it("should clear apiKey", async () => {
    const { useAuthStore } = await import("./auth-store");
    useAuthStore.getState().setApiKey("test-api-key");
    useAuthStore.getState().clearApiKey();
    expect(useAuthStore.getState().apiKey).toBeNull();
  });

  it("should return correct authentication status", async () => {
    const { useAuthStore } = await import("./auth-store");

    // Initially not authenticated
    expect(useAuthStore.getState().isAuthenticated()).toBe(false);

    // After setting key, should be authenticated
    useAuthStore.getState().setApiKey("test-key");
    expect(useAuthStore.getState().isAuthenticated()).toBe(true);

    // After clearing, not authenticated
    useAuthStore.getState().clearApiKey();
    expect(useAuthStore.getState().isAuthenticated()).toBe(false);
  });
});
