import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getUserSettings, upsertUserSettings } from "../db";

export const settingsRouter = router({
  // Get current user's settings
  get: protectedProcedure.query(async ({ ctx }) => {
    const settings = await getUserSettings(ctx.user.id);
    
    // Return default settings if none exist
    if (!settings) {
      return {
        userId: ctx.user.id,
        theme: "system" as const,
        language: "fr",
        voicePreference: "cedar",
        defaultVisibility: "private" as const,
        voiceEnabled: "true" as const,
        additionalSettings: null,
      };
    }
    
    return settings;
  }),

  // Update user settings
  update: protectedProcedure
    .input(z.object({
      theme: z.enum(["light", "dark", "system"]).optional(),
      language: z.string().max(10).optional(),
      voicePreference: z.string().max(50).optional(),
      defaultVisibility: z.enum(["private", "shared", "public"]).optional(),
      voiceEnabled: z.enum(["true", "false"]).optional(),
      additionalSettings: z.record(z.string(), z.any()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const currentSettings = await getUserSettings(ctx.user.id);
      
      const updatedSettings = await upsertUserSettings({
        userId: ctx.user.id,
        theme: input.theme ?? currentSettings?.theme ?? "system",
        language: input.language ?? currentSettings?.language ?? "fr",
        voicePreference: input.voicePreference ?? currentSettings?.voicePreference ?? "cedar",
        defaultVisibility: input.defaultVisibility ?? currentSettings?.defaultVisibility ?? "private",
        voiceEnabled: input.voiceEnabled ?? currentSettings?.voiceEnabled ?? "true",
        additionalSettings: input.additionalSettings ?? currentSettings?.additionalSettings ?? null,
      });

      return updatedSettings;
    }),
});
