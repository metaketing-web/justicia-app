import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { documentsRouter } from "./routers/documents";
import { settingsRouter } from "./routers/settings";
import { permissionsRouter } from "./routers/permissions";
import { ragRouter } from "./routers/rag";
import { notificationsRouter } from "./routers/notifications";

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // Document management
  documents: documentsRouter,
  
  // User settings
  settings: settingsRouter,
  
  // Document permissions
  permissions: permissionsRouter,
  
  // RAG (Retrieval-Augmented Generation)
  rag: ragRouter,
  
  // Notifications
  notifications: notificationsRouter,
});

export type AppRouter = typeof appRouter;
