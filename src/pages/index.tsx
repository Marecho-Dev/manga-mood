import { type NextPage } from "next";
import Head from "next/head";
import { useState } from "react";
import { api } from "~/utils/api";
import Image from "next/image";
import { LoadingPage } from "~/components/loading";
//this is the home page

type MangaData = {
  average_rating: number;
  manga_count: number;
  mal_id: number;
  weighted_rating: number;
  imageUrl: string;
  rating: number;
  title: string;
  rank: number;
  media_type: string;
  author: string;
  status: string;
  summary: string;
  genres: string;
};
export const uiCard = (mangaData: MangaData) => {
  const isEmpty = (text: string): string => {
    if (text == "") {
      return "N/A";
    }
    if (text == "currently_publishing") {
      return "publishing";
    }
    return prettyText(text);
  };
  const prettyText = (text: string): string => {
    return text.replace("_", " ");
  };
  const genreString = mangaData.genres;
  const genreArray = genreString.split(",");
  return (
    <div className="relative">
      <div className="group flex h-full w-full">
        {/* Squares */}
        <div className="absolute top-0 right-0 mt-4 mr-2 space-y-1 text-right font-bold text-gray-600">
          <div className="h-5 w-10">#{mangaData.rank}</div>
          <div className="h-5 w-10">{mangaData.rating}</div>
        </div>
        {/* //image container */}
        <div className="relative h-full w-2/5 flex-none overflow-hidden rounded-t bg-cover text-center lg:rounded-t-none lg:rounded-l">
          <Image
            src={mangaData.imageUrl}
            alt={mangaData.title}
            width={150}
            height={300}
            style={{
              width: "100%",
              height: "100%",
              maxWidth: "100%",
              maxHeight: "100%",
              flexGrow: 1,
              objectFit: "cover",
            }}
          />
          {/* Overlay */}
          <div className="absolute bottom-0 left-0 right-0 flex min-h-[10%] flex-col items-start justify-center space-y-1 rounded-bl bg-black bg-opacity-75 p-5 text-sm text-white">
            <div className="text-left">{mangaData.title}</div>
            <div className="text-left">{isEmpty(mangaData.author)}</div>
          </div>
        </div>
        {/* content container */}
        <div className="flex h-full w-3/5 flex-col justify-between rounded-b border-r border-b border-l border-gray-400 bg-white p-4 leading-normal lg:rounded-b-none lg:rounded-r lg:border-l-0 lg:border-t lg:border-gray-400">
          <div className="mb-8">
            <p className="flex items-center text-sm text-gray-600">
              {isEmpty(mangaData.media_type)}
              <p> &nbsp;·&nbsp; </p>
              <div>{isEmpty(mangaData.status)}</div>
            </p>
            <div className="mb-2 text-xl font-bold text-gray-900">Summary</div>
            <div className="relative h-56">
              <p
                className="h-56 overflow-hidden pl-1 pr-1 text-xs text-gray-700 group-hover:h-56 group-hover:overflow-x-visible group-hover:overflow-y-scroll"
                style={{
                  position: "absolute",
                  width: "100%",
                  top: 0,
                  left: 0,
                  zIndex: 10,
                }}
              >
                {mangaData.summary}
              </p>
            </div>
          </div>
          {/* <div className="flex items-center"> */}
          <div className="w-full text-sm text-gray-900">
            {genreArray.map((genre: string) => (
              <span
                key={genre}
                className="mr-2 mb-2 inline-block rounded-full bg-gray-200 px-3 py-1 text-xs font-semibold text-gray-700"
              >
                {genre}
              </span>
            ))}
          </div>
          {/* </div> */}
        </div>
      </div>
    </div>
  );
};
const Home: NextPage = () => {
  //comment
  //this is home page. Created user variable which is the useUser hook from clerk.
  //trpc lets you create server functions that run on a vercel server. Fetch data from database so you can get data in the rigth shape without
  // having the user to run the database code themselves
  const [cardsDisplayed, setCardsDisplayed] = useState(24);
  const loadMoreCards = () => {
    setCardsDisplayed((prevCardsDisplayed) => prevCardsDisplayed + 24);
  };

  const [input, setInput] = useState<string>("");
  const [executeQuery, SetExectureQuery] = useState<boolean>(false);
  const queryData = api.user.getIdByUsername.useQuery(
    { username: input },
    { enabled: executeQuery }
  );
  console.log(queryData);
  function isMangaDataArray(data: unknown): data is MangaData[] {
    console.log(data);
    return (
      Array.isArray(data) &&
      data.every((item) => typeof item === "object" && "mal_id" in item)
    );
  }

  if (!queryData.isSuccess && queryData.isLoading && queryData.isFetching)
    return <LoadingPage />;
  if (queryData.isSuccess) {
    console.log(queryData);
  }
  return (
    <>
      <Head>
        <title>Manga Mood</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      {!queryData.isSuccess && !queryData.isError && (
        <main className="flex h-screen items-center justify-center">
          <div className="h-24 w-full rounded-md bg-gray-700 md:max-w-2xl">
            <input
              placeholder=">MAL Username"
              className="justify-centerborder-none flex h-full w-full items-center bg-transparent p-2 text-xl text-gray-300 focus:outline-none"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (input !== "") {
                    SetExectureQuery(true);
                    console.log(queryData);
                  }
                }
              }}
            />
          </div>
        </main>
      )}
      {queryData.isSuccess && isMangaDataArray(queryData.data) && (
        <div className="flex flex-col items-center justify-center">
          <div className="mt-20 flex w-full items-end justify-end px-20">
            <div>function bar</div>
          </div>
          <div className="flex h-full w-full items-center justify-center px-1 md:px-20 py-5">
            <div className="grid grid-cols-1 gap-10 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {queryData.data
                .slice(0, cardsDisplayed)
                .map((mangaData: MangaData) => uiCard(mangaData))}
            </div>
          </div>
          <button
            onClick={loadMoreCards}
            className="mt-4 mb-5 w-1/3 items-center justify-center rounded-md bg-blue-500 px-4 py-2 text-white"
          >
            Load more
          </button>
        </div>
      )}
    </>
  );
};

export default Home;
