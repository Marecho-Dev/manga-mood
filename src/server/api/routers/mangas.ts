import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const mangaRouter = createTRPCRouter({
  /**
   * Search for user.
   */
  getGenresByMangaId: publicProcedure
    .input(z.object({ mal_id: z.number() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.prisma.genres.findMany({
        where: { mal_id: input.mal_id },
      });
      return user;
    }),

  createUsername: publicProcedure
    .input(
      z.object({
        username: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const post = await ctx.prisma.user.create({
        data: {
          username: input.username,
        },
      });

      return post;
    }),
});
