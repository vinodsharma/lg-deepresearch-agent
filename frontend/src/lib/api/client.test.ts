import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "./client";

describe("ApiClient", () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", mockFetch);
    apiClient.setApiKey(null);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    mockFetch.mockReset();
  });

  describe("setApiKey", () => {
    it("should include API key in headers when set", async () => {
      apiClient.setApiKey("test-api-key");

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });

      await apiClient.getSessions();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            "X-API-Key": "test-api-key",
          }),
        })
      );
    });

    it("should not include API key header when not set", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });

      await apiClient.getSessions();

      const callHeaders = mockFetch.mock.calls[0][1].headers;
      expect(callHeaders["X-API-Key"]).toBeUndefined();
    });
  });

  describe("getSessions", () => {
    it("should fetch sessions from API", async () => {
      const mockSessions = [
        { id: "1", title: "Session 1", status: "ACTIVE" },
        { id: "2", title: "Session 2", status: "COMPLETED" },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSessions),
      });

      const result = await apiClient.getSessions();

      expect(result).toEqual(mockSessions);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/sessions"),
        expect.any(Object)
      );
    });

    it("should throw error on failed response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: "Unauthorized",
      });

      await expect(apiClient.getSessions()).rejects.toThrow(
        "Failed to fetch sessions"
      );
    });
  });

  describe("createSession", () => {
    it("should create a new session", async () => {
      const mockSession = { id: "1", title: "New Session", status: "ACTIVE" };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSession),
      });

      const result = await apiClient.createSession({ title: "New Session" });

      expect(result).toEqual(mockSession);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/sessions"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ title: "New Session" }),
        })
      );
    });
  });

  describe("deleteSession", () => {
    it("should delete a session", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
      });

      await apiClient.deleteSession("123");

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/sessions/123"),
        expect.objectContaining({
          method: "DELETE",
        })
      );
    });
  });
});
