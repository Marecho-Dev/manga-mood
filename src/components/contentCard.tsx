import Image from "next/image";
import { AiOutlineLink } from "react-icons/ai";
import { useFloating, useInteractions } from "@floating-ui/react";
import { useState } from "react";
import { useHover } from "@floating-ui/react";
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

export const ContentCard = (mangaData: MangaData) => {
  const [isOpen, setIsOpen] = useState(false);
  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
  });

  const hover = useHover(context);
  const { getReferenceProps, getFloatingProps } = useInteractions([hover]);

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
      <div className="flex h-full w-full">
        {/* Squares */}
        <div className="absolute right-0 top-0 mr-2 mt-4 space-y-1 text-right font-bold text-gray-600">
          <div className="h-5 w-10">#{mangaData.rank}</div>
          <div className="h-5 w-10">{mangaData.rating}</div>
        </div>
        {/* //image container */}
        <div className="relative h-full w-2/5 flex-none overflow-hidden rounded-t bg-cover text-center lg:rounded-l lg:rounded-t-none">
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
          <div className="absolute bottom-0 left-0 right-0 flex min-h-[10%] flex-col items-start justify-center space-y-1 bg-black bg-opacity-75 p-5 text-sm text-white">
            <div className="text-left">{mangaData.title}</div>
            <div className="text-left">{isEmpty(mangaData.author)}</div>
          </div>
        </div>
        {/* content container */}
        <div className="flex h-full w-3/5 flex-col justify-between rounded-b border-b border-l border-r border-gray-400 bg-white p-4 leading-normal lg:rounded-b-none lg:rounded-r lg:border-l-0 lg:border-t lg:border-gray-400">
          <div className="mb-8">
            <p className="flex items-center text-sm text-gray-600">
              {isEmpty(mangaData.media_type)}
              <p> &nbsp;·&nbsp; </p>
              <div>{isEmpty(mangaData.status)}</div>
            </p>
            <div className="text-l group relative mb-2 pr-10 font-bold text-gray-900">
              <p
                className="truncate"
                ref={refs.setReference}
                {...getReferenceProps()}
              >
                {mangaData.title}
              </p>
              {isOpen && (
                <div
                  ref={refs.setFloating}
                  style={{
                    ...floatingStyles,
                    backgroundColor: "rgba(0, 0, 0, 1)",
                    padding: "10px",
                    zIndex: 9999,
                  }}
                  {...getReferenceProps()}
                  className="overflow-visible rounded-md bg-slate-800 text-xs text-slate-50"
                >
                  {mangaData.title}
                </div>
              )}
            </div>
            <div className="group relative h-56">
              <p
                className="h-56 overflow-hidden pl-1 pr-2 text-xs text-gray-700 group-hover:h-56 group-hover:overflow-x-visible group-hover:overflow-y-scroll group-hover:pl-1 group-hover:pr-1"
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
                className="mb-2 mr-2 inline-block rounded-full bg-gray-200 px-3 py-1 text-xs font-semibold text-gray-700"
              >
                {genre}
              </span>
            ))}
          </div>
          {/* </div> */}
          <a
            href={`https://myanimelist.net/manga/${mangaData.mal_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-2 right-2 text-black"
          >
            <AiOutlineLink size={24} />
          </a>
        </div>
      </div>
    </div>
  );
};

export default ContentCard;
