import { type NextPage } from "next";
import Head from "next/head";
import { useState } from "react";
import Image from "next/image";
import { api } from "~/utils/api";
//this is the home page

type MangaData = {
  average_rating: number;
  manga_count: number;
  mal_id: number;
  weighted_rating: number;
  imageUrl: string;
  rating: number;
  title: string;
};

const Home: NextPage = () => {
  //comment
  //this is home page. Created user variable which is the useUser hook from clerk.
  //trpc lets you create server functions that run on a vercel server. Fetch data from database so you can get data in the rigth shape without
  // having the user to run the database code themselves

  const [input, setInput] = useState<string>("");
  const [executeQuery, SetExectureQuery] = useState<boolean>(false);
  const queryData = api.user.getIdByUsername.useQuery(
    { username: input },
    { enabled: executeQuery }
  );

  function isMangaDataArray(data: unknown): data is MangaData[] {
    console.log(data);
    return (
      Array.isArray(data) &&
      data.every((item) => typeof item === "object" && "mal_id" in item)
    );
  }

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
        <div>
          <table>
            <thead>
              <tr>
                <th>Manga ID</th>
                <th>Average Rating</th>
                <th>Weighted Rating</th>
              </tr>
            </thead>
            <tbody>
              {queryData.data.map((mangaData: MangaData, index: number) => (
                <tr key={index}>
                  <td>{mangaData.mal_id}</td>
                  <td>{mangaData.title}</td>
                  <td>
                    <div
                      style={{
                        position: "relative",
                        width: "100px",
                        height: "100px",
                      }}
                    >
                      <Image src={mangaData.imageUrl} alt={mangaData.title} />
                    </div>
                  </td>
                  <td>{mangaData.rating}</td>
                  <td>{mangaData.average_rating}</td>
                  <td>{mangaData.weighted_rating}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
};

export default Home;
