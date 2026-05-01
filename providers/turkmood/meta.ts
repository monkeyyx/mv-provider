import { Info, ProviderContext, Link } from "../types";

export const getMeta = async ({
  link,
  provider,
  providerContext,
}: {
  link: string;
  provider: string;
  providerContext: ProviderContext;
}): Promise<Info> => {
  const { axios, cheerio } = providerContext;
  
  let title = `Title (ID: ${link})`;
  let image = "";
  let synopsis = "Stream fetched via TurkMood API.";
  let type = "movie";
  
  try {
    const response = await axios.get(`https://krmzitv.app/?p=${link}`);
    const $ = cheerio.load(response.data);
    
    title = $('meta[property="og:title"]').attr('content')?.replace(" - تطبيق قرمزي", "") || title;
    image = $('meta[property="og:image"]').attr('content') || "";
    synopsis = $('meta[property="og:description"]').attr('content') || synopsis;
    
    if (title.includes("مسلسل")) {
      type = "series";
    }
  } catch (error) {
    console.error("turkmood getMeta error:", error);
  }

  const linkList: Link[] = [
    {
      title: "Watch",
      directLinks: type === "movie" ? [
        {
          title: "Stream 1",
          link: link,
          type: "movie",
        }
      ] : [],
      episodesLink: type === "series" ? `https://krmzitv.app/wp-json/api-3chk/v1/series/${link}` : undefined,
    }
  ];

  return {
    title,
    image,
    synopsis,
    imdbId: "",
    type,
    linkList,
  };
};
