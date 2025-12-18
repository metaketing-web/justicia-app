import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the database functions
vi.mock("./db", () => ({
  getUserSettings: vi.fn(),
  upsertUserSettings: vi.fn(),
  // Include other mocked functions that might be imported
  createDocument: vi.fn(),
  getDocumentById: vi.fn(),
  getDocumentsByUserId: vi.fn(),
  updateDocument: vi.fn(),
  deleteDocument: vi.fn(),
  checkDocumentAccess: vi.fn(),
  getAccessibleDocuments: vi.fn(),
  createDocumentPermission: vi.fn(),
  getDocumentPermissions: vi.fn(),
  deleteDocumentPermission: vi.fn(),
  getUserById: vi.fn(),
}));

// Mock storage
vi.mock("./storage", () => ({
  storagePut: vi.fn(),
  storageGet: vi.fn(),
}));

// Mock RAG services
vi.mock("./services/rag", () => ({
  processDocumentForRAG: vi.fn(),
  searchDocuments: vi.fn(),
  generateRAGResponse: vi.fn(),
}));

import * as db from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-123",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("settings router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("settings.get", () => {
    it("returns existing settings for authenticated user", async () => {
      const mockSettings = {
        id: 1,
        userId: 1,
        theme: "dark" as const,
        language: "fr",
        voicePreference: "nova",
        defaultVisibility: "private" as const,
        voiceEnabled: "true" as const,
        additionalSettings: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.getUserSettings).mockResolvedValue(mockSettings);

      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.settings.get();

      expect(result).toEqual(mockSettings);
      expect(db.getUserSettings).toHaveBeenCalledWith(1);
    });

    it("returns default settings when none exist", async () => {
      vi.mocked(db.getUserSettings).mockResolvedValue(null);

      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.settings.get();

      expect(result).toEqual({
        userId: 1,
        theme: "system",
        language: "fr",
        voicePreference: "cedar",
        defaultVisibility: "private",
        voiceEnabled: "true",
        additionalSettings: null,
      });
    });
  });

  describe("settings.update", () => {
    it("updates settings for authenticated user", async () => {
      const existingSettings = {
        id: 1,
        userId: 1,
        theme: "light" as const,
        language: "fr",
        voicePreference: "cedar",
        defaultVisibility: "private" as const,
        voiceEnabled: "true" as const,
        additionalSettings: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedSettings = {
        ...existingSettings,
        theme: "dark" as const,
        language: "en",
      };

      vi.mocked(db.getUserSettings).mockResolvedValue(existingSettings);
      vi.mocked(db.upsertUserSettings).mockResolvedValue(updatedSettings);

      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.settings.update({
        theme: "dark",
        language: "en",
      });

      expect(result).toEqual(updatedSettings);
      expect(db.upsertUserSettings).toHaveBeenCalledWith({
        userId: 1,
        theme: "dark",
        language: "en",
        voicePreference: "cedar",
        defaultVisibility: "private",
        voiceEnabled: "true",
        additionalSettings: null,
      });
    });

    it("creates settings when updating for first time", async () => {
      const newSettings = {
        id: 1,
        userId: 1,
        theme: "dark" as const,
        language: "fr",
        voicePreference: "cedar",
        defaultVisibility: "private" as const,
        voiceEnabled: "true" as const,
        additionalSettings: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.getUserSettings).mockResolvedValue(null);
      vi.mocked(db.upsertUserSettings).mockResolvedValue(newSettings);

      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.settings.update({
        theme: "dark",
      });

      expect(result).toEqual(newSettings);
      expect(db.upsertUserSettings).toHaveBeenCalledWith({
        userId: 1,
        theme: "dark",
        language: "fr",
        voicePreference: "cedar",
        defaultVisibility: "private",
        voiceEnabled: "true",
        additionalSettings: null,
      });
    });
  });
});
