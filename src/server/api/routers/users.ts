import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import axios, { AxiosResponse } from "axios";
import type { AxiosError } from "axios";
import { contextProps } from "@trpc/react-query/shared";
import { api } from "~/utils/api";
import type { PrismaClient, User, Manga } from "@prisma/client";
import { Token } from "@clerk/nextjs/dist/api";
import { env } from "process";

//publicProcedure method to generate a function that your client calls
//publicProcedure is a procedure that anyone can call without being authenticated, cause we want anyone to have access to the post
//index.tsx runs on users machine, users.ts runs on our servers
type Context = {
  prisma: PrismaClient;
};

//need to update schema for genres table. This needs to be able to have multiple
async function genreInsert(malId: number, genres: [], ctx: Context) {
  try {
    for (const genre of genres) {
      console.log(genre);
      await ctx.prisma.genre.create({
        data: {
          mal_id: malId,
          genre_name: genre.name,
        },
      });
    }
    return "success";
  } catch (error) {
    return "failure";
  }
}

async function mangaInsert(manga: Manga, ctx: Context) {
  try {
    await ctx.prisma.manga.create({
      data: {
        mal_id: manga.mal_id,
        imageUrl: manga.imageUrl,
        rating: manga.rating,
        title: manga.title,
      },
    });
    return "success";
  } catch (error) {
    return "failure";
  }
}

//this is cloned off mangaInsert right now.
async function userMangaListInsert(manga: Manga, ctx: Context) {
  try {
    await ctx.prisma.manga.create({
      data: {
        mal_id: manga.mal_id,
        imageUrl: manga.imageUrl,
        rating: manga.rating,
        title: manga.title,
      },
    });
    return userMangaListSearch("marecho", ctx);
  } catch (error) {
    return "failure";
  }
}

const malMangaSearch = async (mangaId: string, ctx: Context) => {
  const tokenInfo = process.env.NEXT_PUBLIC_MAL_API_ACCESS_TOKEN;
  const headers = {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    Authorization: `Bearer ${tokenInfo}`,
  };

  const params = {
    fields:
      "id,title,main_picture,synopsis,mean,rank,popularity,num_list_users,num_scoring_users,status,genres,my_list_status",
  };
  try {
    const response: AxiosResponse = await axios.get(
      `https://api.myanimelist.net/v2/manga/${mangaId}`,
      {
        headers: headers,
        params: params,
      }
    );
    return response.data;
  } catch (error) {
    console.log(error);
    return "failure";
  }
};

async function findMangaById(
  mangaId: number,
  ctx: Context
): Promise<Manga | null> {
  const manga = await ctx.prisma.manga.findUnique({
    where: { mal_id: mangaId },
  });
  //returns null if manga doesn't exist yet.
  return manga;
}

const userMangaListSearch = async (username: string, ctx: Context) => {
  console.log(`username is ${username}`);
  const tokenInfo = process.env.NEXT_PUBLIC_MAL_API_ACCESS_TOKEN;
  const headers = {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    Authorization: `Bearer ${tokenInfo}`,
  };

  const params = {
    fields: "list_status",
    limit: "1000",
    // 'offset': '5'
  };
  try {
    const response: AxiosResponse = await axios.get(
      `https://api.myanimelist.net/v2/users/${username}/mangalist`,
      {
        headers: headers,
        params: params,
      }
    );

    // for (const manga of response.data.data) {
    //   console.log(manga);

    //   const exists = await findMangaById(manga.node.id, ctx);
    //   //if manga doesn't exist in our planetscale DB, do a mal api request and then insert manga into the db.
    //   if (exists === null) {
    //     const mangaMal = await malMangaSearch(manga.node.id, ctx);
    //     console.log(mangaMal);
    //   }
    // }
    const test = await findMangaById(155723, ctx);
    if (test === null) {
      const mangaMal = await malMangaSearch(155723, ctx);
      let score = 0;
      console.log(mangaMal);
      if ("mean" in mangaMal) {
        score = mangaMal.mean;
      }
      const mangaDbInsert = await mangaInsert(
        {
          mal_id: mangaMal.id,
          imageUrl: mangaMal.main_picture.large,
          rating: score,
          title: mangaMal.title,
        },
        ctx
      );
      const genreDbInsert = await genreInsert(
        mangaMal.id,
        mangaMal.genres,
        ctx
      );
    }
  } catch (error) {
    console.log(error);
  }
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
      return userMangaListSearch("marecho", ctx);
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
