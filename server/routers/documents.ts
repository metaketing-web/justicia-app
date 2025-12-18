import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { 
  createDocument, 
  getDocumentById, 
  getDocumentsByUserId, 
  updateDocument, 
  deleteDocument,
  checkDocumentAccess,
  getAccessibleDocuments
} from "../db";
import { storagePut, storageGet } from "../storage";
import { nanoid } from "nanoid";
import { processDocumentForRAG } from "../services/rag";

export const documentsRouter = router({
  // List all documents for current user
  list: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
      type: z.enum(["imported", "created", "template"]).optional(),
      search: z.string().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const docs = await getDocumentsByUserId(ctx.user.id, {
        limit: input?.limit,
        offset: input?.offset,
        type: input?.type,
        search: input?.search,
      });
      return docs;
    }),

  // Get all accessible documents (owned + shared)
  accessible: protectedProcedure.query(async ({ ctx }) => {
    return getAccessibleDocuments(ctx.user.id);
  }),

  // Get a single document by ID
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const access = await checkDocumentAccess(input.id, ctx.user.id);
      if (!access) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Document not found or access denied" });
      }

      const doc = await getDocumentById(input.id);
      return { document: doc, accessLevel: access };
    }),

  // Create a new document (metadata only, file upload separate)
  create: protectedProcedure
    .input(z.object({
      title: z.string().min(1).max(500),
      type: z.enum(["imported", "created", "template"]).default("imported"),
      description: z.string().optional(),
      fileType: z.string().optional(),
      visibility: z.enum(["private", "shared", "public"]).default("private"),
      metadata: z.record(z.string(), z.any()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const doc = await createDocument({
        userId: ctx.user.id,
        title: input.title,
        type: input.type,
        description: input.description || null,
        fileType: input.fileType || null,
        visibility: input.visibility,
        metadata: input.metadata || null,
        isProcessed: "pending",
      });

      if (!doc) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create document" });
      }

      return doc;
    }),

  // Create document with content (text) - auto-saves to S3 and indexes in RAG
  createWithContent: protectedProcedure
    .input(z.object({
      title: z.string().min(1).max(500),
      content: z.string().min(1),
      type: z.enum(["imported", "created", "template"]).default("created"),
      description: z.string().optional(),
      visibility: z.enum(["private", "shared", "public"]).default("private"),
      metadata: z.record(z.string(), z.any()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // 1. Create document metadata
      const doc = await createDocument({
        userId: ctx.user.id,
        title: input.title,
        type: input.type,
        description: input.description || null,
        fileType: "txt",
        visibility: input.visibility,
        metadata: input.metadata || null,
        isProcessed: "pending",
      });

      if (!doc) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create document" });
      }

      try {
        // 2. Save content to S3
        const fileKey = `documents/${ctx.user.id}/${doc.id}/${nanoid()}-${input.title.replace(/[^a-z0-9]/gi, '_')}.txt`;
        const contentBuffer = Buffer.from(input.content, "utf-8");
        const { url } = await storagePut(fileKey, contentBuffer, "text/plain");

        // 3. Update document with file info
        await updateDocument(doc.id, {
          fileKey,
          fileUrl: url,
          fileSize: contentBuffer.length,
          mimeType: "text/plain",
          fileType: "txt",
          isProcessed: "processing",
        });

        // 4. Index in RAG (async, don't wait)
        processDocumentForRAG(doc.id, input.content).catch(err => {
          console.error(`[RAG] Failed to index document ${doc.id}:`, err);
        });

        // 5. Mark as processed
        await updateDocument(doc.id, { isProcessed: "completed" });

        return { ...doc, fileUrl: url, fileKey };
      } catch (error) {
        // Cleanup: delete document if file upload failed
        await deleteDocument(doc.id);
        throw new TRPCError({ 
          code: "INTERNAL_SERVER_ERROR", 
          message: error instanceof Error ? error.message : "Failed to save document content" 
        });
      }
    }),

  // Upload file for a document
  uploadFile: protectedProcedure
    .input(z.object({
      documentId: z.number(),
      fileContent: z.string(), // Base64 encoded file content
      fileName: z.string(),
      mimeType: z.string(),
      fileSize: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const access = await checkDocumentAccess(input.documentId, ctx.user.id);
      if (access !== "owner" && access !== "admin" && access !== "write") {
        throw new TRPCError({ code: "FORBIDDEN", message: "No write access to this document" });
      }

      // Decode base64 content
      const fileBuffer = Buffer.from(input.fileContent, "base64");
      
      // Generate unique file key
      const fileKey = `documents/${ctx.user.id}/${input.documentId}/${nanoid()}-${input.fileName}`;
      
      // Upload to S3
      const { url } = await storagePut(fileKey, fileBuffer, input.mimeType);

      // Update document with file info
      const updated = await updateDocument(input.documentId, {
        fileKey,
        fileUrl: url,
        fileSize: input.fileSize,
        mimeType: input.mimeType,
        fileType: input.fileName.split(".").pop() || "unknown",
      });

      return updated;
    }),

  // Update document metadata
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().min(1).max(500).optional(),
      description: z.string().optional(),
      visibility: z.enum(["private", "shared", "public"]).optional(),
      metadata: z.record(z.string(), z.any()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const access = await checkDocumentAccess(input.id, ctx.user.id);
      if (access !== "owner" && access !== "admin" && access !== "write") {
        throw new TRPCError({ code: "FORBIDDEN", message: "No write access to this document" });
      }

      const { id, ...updates } = input;
      const cleanUpdates: Record<string, unknown> = {};
      if (updates.title !== undefined) cleanUpdates.title = updates.title;
      if (updates.description !== undefined) cleanUpdates.description = updates.description;
      if (updates.visibility !== undefined) cleanUpdates.visibility = updates.visibility;
      if (updates.metadata !== undefined) cleanUpdates.metadata = updates.metadata;
      
      const updated = await updateDocument(id, cleanUpdates);

      if (!updated) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Document not found" });
      }

      return updated;
    }),

  // Delete a document
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const access = await checkDocumentAccess(input.id, ctx.user.id);
      if (access !== "owner" && access !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only owner or admin can delete documents" });
      }

      const success = await deleteDocument(input.id);
      return { success };
    }),

  // Get presigned URL for downloading a document
  getDownloadUrl: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const access = await checkDocumentAccess(input.id, ctx.user.id);
      if (!access) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Document not found or access denied" });
      }

      const doc = await getDocumentById(input.id);
      if (!doc?.fileKey) {
        throw new TRPCError({ code: "NOT_FOUND", message: "No file associated with this document" });
      }

      const { url } = await storageGet(doc.fileKey);
      return { url };
    }),
});
