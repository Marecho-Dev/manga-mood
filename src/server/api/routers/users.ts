import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import axios from "axios";
import type { AxiosResponse } from "axios";
import type { AxiosError } from "axios";
import type { PrismaClient, User, Manga, MangaList } from "@prisma/client";

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
  rank: number;
  mean: number;
  media_type: string;
  author: string;
  status: string;
  summary: string;

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

interface listStatusNode {
  score: number;
}
interface MangaDataItem {
  node: MangaNode;
  list_status: listStatusNode;
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
  mal_id: number;
  weighted_rating: number;
  imageUrl: string;
  rating: number;
  title: string;
  author: string;
  rank: number;
  media_type: string;
  status: string;
  genres: string;
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
        author: manga.author,
        rank: manga.rank,
        media_type: manga.media_type,
        status: manga.status,
      },
    });
    return "success";
  } catch (error) {
    return "failure";
  }
}

async function mangaListInsert(mangaListing: MangaList, ctx: Context) {
  // console.log(`calling manga insert on`);
  // console.log(manga);
  try {
    await ctx.prisma.mangaList.create({
      data: {
        user_id: mangaListing.user_id,
        manga_id: mangaListing.manga_id,
        rating: mangaListing.rating,
      },
    });
    return "success";
  } catch (error) {
    return "failure";
  }
}

async function mangaUpdate(manga: Manga, ctx: Context) {
  // console.log(`calling manga insert on`);
  // console.log(manga);
  try {
    await ctx.prisma.manga.create({
      data: {
        mal_id: manga.mal_id,
        imageUrl: manga.imageUrl,
        rating: manga.rating,
        title: manga.title,
        author: manga.author,
        rank: manga.rank,
        media_type: manga.media_type,
        status: manga.status,
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
      "id,title,main_picture,synopsis,mean,rank,popularity,num_list_users,num_scoring_users,authors,status,genres,media_type,my_list_status",
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

const userMangaListSearch = async (
  user: User[],
  username: string,
  ctx: Context
) => {
  console.log("we are in userMangaListSearch");
  console.log(user);
  const tokenInfo = process.env.NEXT_PUBLIC_MAL_API_ACCESS_TOKEN;
  //setting up axios request
  const headers = {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    Authorization: `Bearer ${tokenInfo}`,
  };

  const params = {
    fields: "list_status",
    limit: "1000",
    nsfw: "true",
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
    console.log("looping through each manga in their list");
    for (const manga of response.data.data) {
      // console.log(user[0]?.id);
      // console.log(manga);
      const exists = await findMangaById(manga.node.id, ctx);
      //if manga doesn't exist in our planetscale DB, do a mal api request and then insert manga into the db.
      if (exists === null) {
        console.log("manga doesnt exist");
        const mangaMal = await malMangaSearch(manga.node.id);
        console.log(mangaMal);
        let score = 0;
        if (mangaMal != "failure" && "mean" in mangaMal) {
          score = mangaMal.mean;
          await mangaInsert(
            {
              mal_id: mangaMal.id,
              imageUrl: mangaMal.main_picture.large,
              rating: score,
              title: mangaMal.title,
              rank: mangaMal.rank,
              media_type: mangaMal.media_type,
              author: mangaMal.author,
              status: mangaMal.status,
              summary: mangaMal.summary,
            },
            ctx
          );
        }
      }
      // console.log(user[0]?.id);
      if (user[0]?.id) {
        // console.log("about to call mangaListInsert");
        await mangaListInsert(
          {
            user_id: user[0].id,
            manga_id: manga.node.id,
            rating: manga.list_status.score,
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
    console.log(user[0]?.id);
    return recommendationApiCall(user[0]?.id || 0);
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
    console.log(`https://http://134.122.8.27/manga_recs//manga_recs/${userId}`);
    const recommendations: AxiosResponse<MangaRecommendation[]> =
      await axios.get(`http://134.122.8.27/manga_recs/${userId}`);
    // console.log(recommendations);
    console.log("calling recommendations");
    // console.log(recommendations);
    return recommendations.data;
  } catch (error) {
    console.log("caught error");
    throw error;
  }
};
const malUsernameSearch = async (username: string): Promise<string> => {
  console.log("checking if username exists on myanimelist");
  try {
    await axios.get(`https://myanimelist.net/profile/${username}`);
    return "success";
  } catch (error) {
    const err = error as AxiosError;
    console.log(err);
    if (err.response?.status === 404) {
      return err.response?.statusText;
    }
    throw err.message;
  }
};

const isUserNull = async (user: User[], username: string, ctx: Context) => {
  // console.log(user);
  console.log(username);
  // console.log(user[0]?.username);
  if (Object.keys(user).length === 0) {
    try {
      console.log(
        "user is null in our db - checking if the name exists on MAL"
      );
      const queryResponse = await malUsernameSearch(username);
      console.log("query response is " + queryResponse);
      let newUser: User | undefined;
      if (queryResponse === "success") {
        newUser = await ctx.prisma.user.create({
          data: {
            username: username,
          },
        });

        return userMangaListSearch(newUser ? [newUser] : [], username, ctx);
      } else {
        console.log("returning user not found");
        return queryResponse;
      }
    } catch (error) {
      console.log(error);
      return "failure";
    }
  } else {
    // return recommendationApiCall(user[0]?.id || 0); //default value, theoretically this should never be hit.
    return recommendationApiCall(user[0]?.id || 0);
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
