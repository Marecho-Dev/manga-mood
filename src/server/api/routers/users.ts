import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import axios, { AxiosResponse } from "axios";
import type { AxiosError } from "axios";
import { contextProps } from "@trpc/react-query/shared";
import { api } from "~/utils/api";
import type { PrismaClient, User } from "@prisma/client";
import { Token } from "@clerk/nextjs/dist/api";
import { env } from "process";

//publicProcedure method to generate a function that your client calls
//publicProcedure is a procedure that anyone can call without being authenticated, cause we want anyone to have access to the post
//index.tsx runs on users machine, users.ts runs on our servers
type Context = {
  prisma: PrismaClient;
};

const userMangaListSearch = (username: string) => {
  console.log(`username is ${username}`);
  const tokenInfo = process.env.NEXT_PUBLIC_MAL_API_ACCESS_TOKEN;
  const headers = {
    Authorization: `Bearer ${tokenInfo}`,
  };

  const params = {
    fields: "list_status",
    limit: "1000",
    // 'offset': '5'
  };
  axios
    .get(`https://api.myanimelist.net/v2/users/${username}/mangalist`, {
      headers: headers,
      params: params,
    })
    .then((response) => {
      for (const manga of response.data.data) {
        console.log(manga);
      }
    })
    .catch((error) => {
      console.log(error);
    });
};

const malUsernameSearch = async (username: string): Promise<string> => {
  try {
    await axios.get(`https://myanimelist.net/profile/${username}`);
    return "success";
  } catch (error) {
    const err = error as AxiosError;
    if (err.response?.status === 404) {
      return "failure";
    }
    throw error;
  }
};

const isUserNull = async (user: User[], username: string, ctx: Context) => {
  console.log(user[0]?.username);
  if (Object.keys(user).length === 0) {
    try {
      const queryResponse = await malUsernameSearch(username);
      if (queryResponse === "success")
        await ctx.prisma.user.create({
          data: {
            username: username,
          },
        });
      return userMangaListSearch(username);
    } catch (error) {
      return "failure";
    }
  } else {
    return "success";
  }
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
