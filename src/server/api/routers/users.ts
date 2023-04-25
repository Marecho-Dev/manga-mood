import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import axios from "axios";
import type { AxiosResponse } from "axios";
import type { AxiosError } from "axios";
import type { PrismaClient, User, Manga } from "@prisma/client";

//publicProcedure method to generate a function that your client calls
//publicProcedure is a procedure that anyone can call without being authenticated, cause we want anyone to have access to the post
//index.tsx runs on users machine, users.ts runs on our servers
type Context = {
  prisma: PrismaClient;
};

//need to update schema for genres table. This needs to be able to have multiple
// async function genreInsert(malId: number, genres: [], ctx: Context) {
//   try {
//     for (const genre of genres) {
//       console.log(genre);
//       await ctx.prisma.genre.create({
//         data: {
//           mal_id: malId,
//           genre_name: genre.name,
//         },
//       });
//     }
//     return "success";
//   } catch (error) {
//     return "failure";
//   }
// }
interface ApiResponse {
  id: number;
  title: string;
  main_picture: {
    medium: string;
    large: string;
  };
  mean: number;
  // other properties can be added if needed
}

interface MangaNode {
  id: number;
  title: string;
  main_picture: {
    medium: string;
    large: string;
  };
}

interface MangaDataItem {
  node: MangaNode;
  ranking: {
    rank: number;
  };
}

interface UserMangaListResponse {
  data: MangaDataItem[];
  paging: {
    next: string;
  };
}

interface MangaRecommendation {
  average_rating: number;
  manga_count: number;
  manga_id: number;
  weighted_rating: number;
}

async function mangaInsert(manga: Manga, ctx: Context) {
  // console.log(`calling manga insert on`);
  // console.log(manga);
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
// async function userMangaListInsert(manga: Manga, ctx: Context) {
//   try {
//     await ctx.prisma.manga.create({
//       data: {
//         mal_id: manga.mal_id,
//         imageUrl: manga.imageUrl,
//         rating: manga.rating,
//         title: manga.title,
//       },
//     });
//     return userMangaListSearch("marecho", ctx);
//   } catch (error) {
//     return "failure";
//   }
// }

const malMangaSearch = async (mangaId: number) => {
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
    const response: AxiosResponse<ApiResponse> = await axios.get(
      `https://api.myanimelist.net/v2/manga/${mangaId}`,
      {
        headers: headers,
        params: params,
      }
    );
    // console.log(response.data);
    return response.data;
  } catch (error) {
    // console.log(error);
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
  const tokenInfo = process.env.NEXT_PUBLIC_MAL_API_ACCESS_TOKEN;
  //setting up axios request
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
    const response: AxiosResponse<UserMangaListResponse> = await axios.get(
      `https://api.myanimelist.net/v2/users/${username}/mangalist`,
      {
        headers: headers,
        params: params,
      }
    );
    //looping through the axios return which is a list of mangas
    for (const manga of response.data.data) {
      const exists = await findMangaById(manga.node.id, ctx);
      //if manga doesn't exist in our planetscale DB, do a mal api request and then insert manga into the db.
      if (exists === null) {
        const mangaMal = await malMangaSearch(manga.node.id);
        let score = 0;
        if (mangaMal != "failure" && "mean" in mangaMal) {
          score = mangaMal.mean;
          await mangaInsert(
            {
              mal_id: mangaMal.id,
              imageUrl: mangaMal.main_picture.large,
              rating: score,
              title: mangaMal.title,
            },
            ctx
          );
        }

        //-------------------- commenting this piece out for now. genre table needs to be updated as it's causing some issues. --------------------
        // const genreDbInsert = await genreInsert(
        //   mangaMal.id,
        //   mangaMal.genres,
        //   ctx
        // );
      }
    }
  } catch (error) {
    // console.log(error);
  }
};
const recommendationApiCall = async (
  userId: number
): Promise<MangaRecommendation[]> => {
  console.log(userId);
  console.log("recommendationApiCall");
  // console.log(userId);
  try {
    console.log("trying");
    console.log(`https://restful-manga-recs.onrender.com/manga_recs/${userId}`);
    const recommendations: AxiosResponse<MangaRecommendation[]> =
      await axios.get(
        `https://restful-manga-recs.onrender.com/manga_recs/${userId}`
      );
    // console.log(recommendations);
    console.log("calling recommendations");
    console.log(recommendations);
    return recommendations.data;
  } catch (error) {
    console.log("caught error");
    throw error;
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
    throw err.message;
  }
};

const isUserNull = async (user: User[], username: string, ctx: Context) => {
  console.log(user);
  console.log(username);
  // console.log(user[0]?.username);
  if (Object.keys(user).length === 0) {
    try {
      const queryResponse = await malUsernameSearch(username);
      if (queryResponse === "success")
        await ctx.prisma.user.create({
          data: {
            username: username,
          },
        });
      return userMangaListSearch(username, ctx);
    } catch (error) {
      return "failure";
    }
  } else {
    return recommendationApiCall(user[0]?.id || 0); //default value, theoretically this should never be hit.
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
      console.log(user);
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
