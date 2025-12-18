import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the database functions
vi.mock("./db", () => ({
  createDocument: vi.fn(),
  getDocumentById: vi.fn(),
  getDocumentsByUserId: vi.fn(),
  updateDocument: vi.fn(),
  deleteDocument: vi.fn(),
  checkDocumentAccess: vi.fn(),
  getAccessibleDocuments: vi.fn(),
}));

// Mock the storage functions
vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ key: "test-key", url: "https://example.com/file.pdf" }),
  storageGet: vi.fn().mockResolvedValue({ key: "test-key", url: "https://example.com/file.pdf" }),
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

function createUnauthContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("documents router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("documents.list", () => {
    it("returns documents for authenticated user", async () => {
      const mockDocuments = [
        {
          id: 1,
          userId: 1,
          title: "Test Document",
          type: "imported" as const,
          fileType: "pdf",
          fileKey: "docs/1/test.pdf",
          fileUrl: "https://example.com/test.pdf",
          fileSize: 1024,
          mimeType: "application/pdf",
          description: "A test document",
          metadata: null,
          isProcessed: "completed" as const,
          visibility: "private" as const,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(db.getDocumentsByUserId).mockResolvedValue(mockDocuments);

      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.documents.list({});

      expect(result).toEqual(mockDocuments);
      expect(db.getDocumentsByUserId).toHaveBeenCalledWith(1, {
        limit: 50,
        offset: 0,
        type: undefined,
        search: undefined,
      });
    });

    it("throws error for unauthenticated user", async () => {
      const ctx = createUnauthContext();
      const caller = appRouter.createCaller(ctx);

      await expect(caller.documents.list({})).rejects.toThrow();
    });
  });

  describe("documents.create", () => {
    it("creates a new document for authenticated user", async () => {
      const mockDocument = {
        id: 1,
        userId: 1,
        title: "New Document",
        type: "imported" as const,
        fileType: "pdf",
        fileKey: null,
        fileUrl: null,
        fileSize: null,
        mimeType: null,
        description: "A new document",
        metadata: null,
        isProcessed: "pending" as const,
        visibility: "private" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.createDocument).mockResolvedValue(mockDocument);

      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.documents.create({
        title: "New Document",
        type: "imported",
        description: "A new document",
        visibility: "private",
      });

      expect(result).toEqual(mockDocument);
      expect(db.createDocument).toHaveBeenCalledWith({
        userId: 1,
        title: "New Document",
        type: "imported",
        description: "A new document",
        fileType: null,
        visibility: "private",
        metadata: null,
        isProcessed: "pending",
      });
    });
  });

  describe("documents.get", () => {
    it("returns document with access level for authorized user", async () => {
      const mockDocument = {
        id: 1,
        userId: 1,
        title: "Test Document",
        type: "imported" as const,
        fileType: "pdf",
        fileKey: "docs/1/test.pdf",
        fileUrl: "https://example.com/test.pdf",
        fileSize: 1024,
        mimeType: "application/pdf",
        description: "A test document",
        metadata: null,
        isProcessed: "completed" as const,
        visibility: "private" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.checkDocumentAccess).mockResolvedValue("owner");
      vi.mocked(db.getDocumentById).mockResolvedValue(mockDocument);

      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.documents.get({ id: 1 });

      expect(result).toEqual({
        document: mockDocument,
        accessLevel: "owner",
      });
    });

    it("throws NOT_FOUND for unauthorized access", async () => {
      vi.mocked(db.checkDocumentAccess).mockResolvedValue(null);

      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      await expect(caller.documents.get({ id: 999 })).rejects.toThrow("Document not found or access denied");
    });
  });

  describe("documents.delete", () => {
    it("deletes document for owner", async () => {
      vi.mocked(db.checkDocumentAccess).mockResolvedValue("owner");
      vi.mocked(db.deleteDocument).mockResolvedValue(true);

      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.documents.delete({ id: 1 });

      expect(result).toEqual({ success: true });
      expect(db.deleteDocument).toHaveBeenCalledWith(1);
    });

    it("throws FORBIDDEN for non-owner user", async () => {
      vi.mocked(db.checkDocumentAccess).mockResolvedValue("read");

      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      await expect(caller.documents.delete({ id: 1 })).rejects.toThrow("Only owner or admin can delete documents");
    });
  });
});
