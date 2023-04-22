import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
// import axios from "axios";
import { contextProps } from "@trpc/react-query/shared";
import { api } from "~/utils/api";
import type { PrismaClient, User } from "@prisma/client";

//publicProcedure method to generate a function that your client calls
//publicProcedure is a procedure that anyone can call without being authenticated, cause we want anyone to have access to the post
//index.tsx runs on users machine, users.ts runs on our servers
type Context = {
  prisma: PrismaClient;
};

const malUsernameSearch = (username: string) => {
  console.log(username);
  const axios = require("axios");
};
const isUserNull = async (user: User[], username: string, ctx: Context) => {
  if (Array.isArray(user) && user.length === 0) {
    await ctx.prisma.user.create({
      data: {
        username: username,
      },
    });

    return "success";
  }
  return user;
};

export const userRouter = createTRPCRouter({
  /**
   * Search for user.
   */
  getIdByUsername: publicProcedure
    .input(z.object({ username: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findMany({
        where: { username: input.username },
      });

      return isUserNull(user, input.username, ctx);
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
