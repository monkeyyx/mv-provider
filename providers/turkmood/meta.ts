import { Info, ProviderContext, Link } from "../types";

export const getMetaData = async ({
  link,
  provider,
  providerContext,
}: {
  link: string;
  provider: string;
  providerContext: ProviderContext;
}): Promise<Info> => {
  // `link` contains the ID of the movie or series.
  // We return a single direct link that will be passed to `getStream`.
  
  const linkList: Link[] = [
    {
      title: "Watch",
      directLinks: [
        {
          title: "Stream 1",
          link: link,
          type: "movie", // We assume movie for now. If needed, we can adapt this for episodes.
        }
      ]
    }
  ];

  return {
    title: `Title (ID: ${link})`, // Title is not provided in metadata request
    image: "",
    synopsis: "Stream fetched via TurkMood API.",
    imdbId: "",
    type: "movie",
    linkList,
  };
};
