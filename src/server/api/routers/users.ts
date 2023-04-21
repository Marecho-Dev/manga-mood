import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

//publicProcedure method to generate a function that your client calls
//publicProcedure is a procedure that anyone can call without being authenticated, cause we want anyone to have access to the post
//index.tsx runs on users machine, users.ts runs on our servers
export const userRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    const users = await ctx.prisma.user.findMany({
      take: 100,
      // where: {authorId: ctx.user.id},});this would be if you wanted to do a specific where clause for example in our case mangas liked by a specific users
    });
  }),
});
