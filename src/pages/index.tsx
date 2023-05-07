import { type NextPage } from "next";
import Head from "next/head";
import { useState, useEffect } from "react";
import { api } from "~/utils/api";
import { LoadingPage } from "~/components/loading";
import { CategoryFilter } from "~/components/categoryFilter";
import { ContentCard } from "~/components/contentCard";
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
  //comment
  //this is home page. Created user variable which is the useUser hook from clerk.
  //trpc lets you create server functions that run on a vercel server. Fetch data from database so you can get data in the rigth shape without

  //state to control how many cards are being displayed on the screen. Eventually should have the option to change how many you want to display at one.
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
  };

  //controls the username being input via the first page.
  const [input, setInput] = useState<string>("");
  const [executeQuery, SetExectureQuery] = useState<boolean>(false);
  const queryData = api.user.getIdByUsername.useQuery(
    { username: input },
    { enabled: executeQuery }
  );
  const [allGenres, setAllGenres] = useState<string[]>([]);
  useEffect(() => {
    if (queryData.isSuccess && isMangaDataArray(queryData.data)) {
      if (
        selectedFilters.genres.length === 0 &&
        selectedFilters.status.length === 0
      ) {
        setFilteredData(queryData.data);
        const allGenres: string[] = [];
        queryData.data.forEach((mangaData: MangaData) => {
          const genreArray = mangaData.genres.split(",");
          genreArray.forEach((genre: string) => {
            if (!allGenres.includes(genre.trim())) {
              allGenres.push(genre.trim());
            }
          });
        });
        setAllGenres(allGenres);
        console.log(allGenres);
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
  console.log(allGenres);
  // console.log(queryData);
  function isMangaDataArray(data: unknown): data is MangaData[] {
    // console.log(data);
    return (
      Array.isArray(data) &&
      data.every((item) => typeof item === "object" && "mal_id" in item)
    );
  }

  if (!queryData.isSuccess && queryData.isLoading && queryData.isFetching)
    return <LoadingPage />;
  if (queryData.isSuccess) {
    // console.log(queryData);
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
                    // console.log(queryData);
                  }
                }
              }}
            />
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
            className={`mt-4 mb-5 w-1/3 items-center justify-center rounded-md ${
              cardsDisplayed >= filteredData.length
                ? "text-gray- bg-gray-500"
                : "bg-blue-500"
            } px-4 py-2 text-white`}
          >
            Load more
          </button>
        </div>
      )}
    </>
  );
};

export default Home;
