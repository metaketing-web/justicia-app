import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { checkDocumentAccess, getDocumentById } from "../db";
import { 
  processDocumentForRAG, 
  searchDocuments, 
  generateRAGResponse 
} from "../services/rag";

export const ragRouter = router({
  // Process a document for RAG (extract, chunk, embed)
  process: protectedProcedure
    .input(z.object({ documentId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const access = await checkDocumentAccess(input.documentId, ctx.user.id);
      if (!access) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Document not found or access denied" });
      }

      const doc = await getDocumentById(input.documentId);
      if (!doc?.fileKey) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Document has no file to process" });
      }

      try {
        await processDocumentForRAG(input.documentId);
        return { success: true, message: "Document processed successfully" };
      } catch (error) {
        throw new TRPCError({ 
          code: "INTERNAL_SERVER_ERROR", 
          message: `Failed to process document: ${error instanceof Error ? error.message : "Unknown error"}` 
        });
      }
    }),

  // Search across user's documents
  search: protectedProcedure
    .input(z.object({
      query: z.string().min(1).max(1000),
      topK: z.number().min(1).max(20).default(5),
    }))
    .query(async ({ ctx, input }) => {
      const results = await searchDocuments(ctx.user.id, input.query, input.topK);
      return results;
    }),

  // Generate a RAG-augmented response
  ask: protectedProcedure
    .input(z.object({
      query: z.string().min(1).max(2000),
      systemPrompt: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const result = await generateRAGResponse(
          ctx.user.id, 
          input.query, 
          input.systemPrompt
        );
        return result;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to generate response: ${error instanceof Error ? error.message : "Unknown error"}`
        });
      }
    }),

  // Get processing status of a document
  status: protectedProcedure
    .input(z.object({ documentId: z.number() }))
    .query(async ({ ctx, input }) => {
      const access = await checkDocumentAccess(input.documentId, ctx.user.id);
      if (!access) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Document not found or access denied" });
      }

      const doc = await getDocumentById(input.documentId);
      return {
        documentId: input.documentId,
        isProcessed: doc?.isProcessed || "pending",
      };
    }),
});
