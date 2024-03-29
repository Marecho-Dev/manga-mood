import { type NextPage } from "next";
import Head from "next/head";
import { useState, useEffect, useCallback } from "react";
import { api } from "~/utils/api";
import { LoadingPage } from "~/components/loading";
import { CategoryFilter } from "~/components/categoryFilter";
import { ContentCard } from "~/components/contentCard";
import { useQueryClient } from "@tanstack/react-query";
import { getQueryKey } from "@trpc/react-query";
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

type filter = { genres: string[]; status: string[] };

const Home: NextPage = () => {
  const queryClient = useQueryClient();
  //this is home page. Created user variable which is the useUser hook from clerk.
  //trpc lets you create server functions that run on a vercel server. Fetch data from database so you can get data in the rigth shape without
  //state to control how many cards are being displayed on the screen. Eventually should have the option to change how many you want to display at once.
  //for now default behavior is loading 24 more cards. Eventually user will be able to determine how many cards are being displayed.
  const [cardsDisplayed, setCardsDisplayed] = useState(24);
  const loadMoreCards = () => {
    setCardsDisplayed((prevCardsDisplayed) => prevCardsDisplayed + 24);
  };

  //These control the filters being recieved from the filter dropdown. selectedFilters used in our mapping when displaying content cards.
  const [selectedFilters, setSelectedFilters] = useState<filter>({
    genres: [],
    status: [],
  });
  const [filteredData, setFilteredData] = useState<MangaData[]>([]);
  const handleApplyFilters = (selectedFilters: filter) => {
    console.log("Applied filters:", selectedFilters);
    const updatedFilters = { ...selectedFilters };
    setSelectedFilters(updatedFilters);
    updateFilteredData(updatedFilters);
  };

  //controls the username being input via the first page.
  const [input, setInput] = useState<string>("");
  //determines when the username get's queried.
  const [executeQuery, SetExectureQuery] = useState<boolean>(false);
  const queryData = api.user.getIdByUsername.useQuery(
    { username: input },
    {
      enabled: executeQuery,
      //onSuccess to invalidate data if data is = "Not Found". This means invalid username and we want to remove our query from the cache and "reset".
      onSuccess: (data) => {
        // Invalidate the query after it returns success
        const queryKey = getQueryKey(
          api.user.getIdByUsername,
          { username: input },
          "query"
        );
        if (data === "Not Found") {
          queryClient.removeQueries(queryKey);
          //this is to keep track of invalid usernames when "reset"
          setIsValidUsername(false);
          SetExectureQuery(false);
          setInput("");
        }
      },
    }
  );
  //useCallBack memoize functions in react. Returns memoized version of the callback function which only changes if one of the dependencies specified int he dependancy array changes
  const updateFilteredData = useCallback(
    (filters: filter) => {
      if (queryData.isSuccess && isMangaDataArray(queryData.data)) {
        if (filters.genres.length === 0 && filters.status.length === 0) {
        } else {
          const filtered = queryData.data.filter((mangaData: MangaData) => {
            const genreMatch =
              filters.genres.length === 0 ||
              filters.genres.every((genre) => mangaData.genres.includes(genre));
            const statusMatch =
              filters.status.length === 0 ||
              filters.status.includes(mangaData.status);

            return genreMatch && statusMatch;
          });
          setFilteredData(filtered);
        }
      }
    },
    [queryData.data, queryData.isSuccess]
  );
  const [allGenres, setAllGenres] = useState<string[]>([]);
  useEffect(() => {
    if (queryData.isSuccess && isMangaDataArray(queryData.data)) {
      const genreSet: Set<string> = new Set();

      queryData.data.forEach((mangaData: MangaData) => {
        const genreArray = mangaData.genres.split(",");
        genreArray.forEach((genre: string) => {
          genreSet.add(genre.trim());
        });
      });

      setAllGenres([...genreSet]);

      if (
        selectedFilters.genres.length === 0 &&
        selectedFilters.status.length === 0
      ) {
        setFilteredData(queryData.data);
      } else {
        const filtered = queryData.data.filter((mangaData: MangaData) => {
          const genreMatch =
            selectedFilters.genres.length === 0 ||
            selectedFilters.genres.every((genre) =>
              mangaData.genres.includes(genre)
            );
          const statusMatch =
            selectedFilters.status.length === 0 ||
            selectedFilters.status.includes(mangaData.status);

          return genreMatch && statusMatch;
        });
        setFilteredData(filtered);
      }
    }
  }, [
    selectedFilters.genres,
    selectedFilters.status,
    queryData.data,
    queryData.isSuccess,
  ]);

  // console.log(queryData);
  function isMangaDataArray(data: unknown): data is MangaData[] {
    // console.log(data);
    return (
      Array.isArray(data) &&
      data.every((item) => typeof item === "object" && "mal_id" in item)
    );
  }
  const [isValidUsername, setIsValidUsername] = useState<boolean | null>(null);

  if (!queryData.isSuccess && queryData.isLoading && queryData.isFetching)
    return <LoadingPage />;

  return (
    <>
      <Head>
        <title>Manga Mood</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      {!queryData.isSuccess && !queryData.isError && (
        <main className="flex h-screen flex-col items-center justify-center">
          <div className="relative flex w-full flex-col md:max-w-2xl">
            <div className="flex h-24 w-full items-center rounded-md bg-gray-700 md:max-w-2xl">
              <input
                placeholder=">Enter your MAL Username (e.g. Marecho)"
                className="justify-centerborder-none flex h-full w-full items-center bg-transparent p-2 text-xl text-gray-300 focus:outline-none"
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (input !== "") {
                      SetExectureQuery(true);
                      // console.log(queryData);
                    }
                  }
                }}
              />
              <button
                className="flex items-center rounded-full p-5 "
                onClick={() => {
                  if (input !== "") {
                    SetExectureQuery(true);
                    // You can also add other actions here.
                  }
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1}
                  stroke="currentColor"
                  className="h-12 w-12 hover:stroke-gray-300"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 15.75l-2.489-2.489m0 0a3.375 3.375 0 10-4.773-4.773 3.375 3.375 0 004.774 4.774zM21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </button>
            </div>
            {isValidUsername == false && (
              <div className="absolute left-0 top-full p-2 text-rose-400">
                * Invalid myanimelist username, please input a valid username
              </div>
            )}
          </div>
        </main>
      )}

      {queryData.isSuccess && isMangaDataArray(queryData.data) && (
        <div className="flex flex-col items-center justify-center">
          <div className="mt-5 flex w-full items-end justify-end px-2 md:mt-20 md:px-20">
            <div>
              <CategoryFilter
                allGenres={allGenres}
                onApplyFilters={handleApplyFilters}
                currentFilters={selectedFilters}
              />
            </div>
          </div>
          <div className="flex h-full w-full items-center justify-center px-2 py-5 md:px-20">
            <div className="grid grid-cols-1 gap-10 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {filteredData
                .slice(0, cardsDisplayed)
                .map((mangaData: MangaData) => (
                  <ContentCard key={mangaData.mal_id} {...mangaData} />
                ))}
            </div>
          </div>
          <button
            onClick={loadMoreCards}
            disabled={cardsDisplayed >= filteredData.length}
            className={`mb-5 mt-4 w-1/3 items-center justify-center rounded-md ${
              cardsDisplayed >= filteredData.length
                ? "text-gray- bg-gray-500"
                : "bg-blue-500"
            } px-4 py-2 text-white`}
          >
            {cardsDisplayed >= filteredData.length
              ? "Nothing left to load"
              : "Load more"}
          </button>
        </div>
      )}
    </>
  );
};

export default Home;
