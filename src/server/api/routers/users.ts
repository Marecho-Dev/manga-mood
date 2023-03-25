import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

//publicProcedure method to generate a function that your client calls
//publicProcedure is a procedure that anyone can call without being authenticated, cause we want anyone to have access to the post
//index.tsx runs on users machine, users.ts runs on our servers
export const userRouter = createTRPCRouter({
  getAll: publicProcedure.query(({ ctx }) => {
    return ctx.prisma.user.findMany();
  }),
});
