import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { 
  checkDocumentAccess, 
  createDocumentPermission, 
  getDocumentPermissions,
  deleteDocumentPermission,
  getDocumentById,
  getUserById
} from "../db";

export const permissionsRouter = router({
  // Get all permissions for a document
  list: protectedProcedure
    .input(z.object({ documentId: z.number() }))
    .query(async ({ ctx, input }) => {
      const access = await checkDocumentAccess(input.documentId, ctx.user.id);
      if (access !== "owner" && access !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only owner or admin can view permissions" });
      }

      const permissions = await getDocumentPermissions(input.documentId);
      return permissions;
    }),

  // Grant permission to a user
  grant: protectedProcedure
    .input(z.object({
      documentId: z.number(),
      userId: z.number(),
      permission: z.enum(["read", "write", "admin"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const access = await checkDocumentAccess(input.documentId, ctx.user.id);
      if (access !== "owner" && access !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only owner or admin can grant permissions" });
      }

      // Verify target user exists
      const targetUser = await getUserById(input.userId);
      if (!targetUser) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Target user not found" });
      }

      // Verify document exists
      const doc = await getDocumentById(input.documentId);
      if (!doc) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Document not found" });
      }

      // Cannot grant permission to document owner
      if (doc.userId === input.userId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot grant permission to document owner" });
      }

      const permission = await createDocumentPermission({
        documentId: input.documentId,
        userId: input.userId,
        permission: input.permission,
        grantedBy: ctx.user.id,
      });

      return permission;
    }),

  // Revoke permission from a user
  revoke: protectedProcedure
    .input(z.object({
      documentId: z.number(),
      userId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const access = await checkDocumentAccess(input.documentId, ctx.user.id);
      if (access !== "owner" && access !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only owner or admin can revoke permissions" });
      }

      await deleteDocumentPermission(input.documentId, input.userId);
      return { success: true };
    }),

  // Check current user's access level for a document
  check: protectedProcedure
    .input(z.object({ documentId: z.number() }))
    .query(async ({ ctx, input }) => {
      const access = await checkDocumentAccess(input.documentId, ctx.user.id);
      return { access };
    }),
});
