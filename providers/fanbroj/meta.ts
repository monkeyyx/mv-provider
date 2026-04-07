import { Info, ProviderContext } from "../types";

const DEFAULT_IMAGE = "https://placehold.jp/24/363636/ffffff/500x750.png?text=Fanbroj";

export const getMeta = async function ({
  link,
  provider,
  providerContext,
}: {
  link: string;
  provider: string;
  providerContext: ProviderContext;
}): Promise<Info> {
  console.log(`[Fanbroj] Fetching Meta (v3.4.5) for: ${link}`);
  const { axios, commonHeaders } = providerContext;

  const baseUrl = "https://fanbroj.net";
  
  // link format: /movies/[slug] or /series/[slug] or legacy /series_episodes.php?id=[id]
  const isSeries = link.includes("/series/") || link.includes("series_episodes.php");
  
  // Extract slug/id
  let slug = "";
  if (link.includes("id=")) {
    slug = link.split("id=")[1].split("&")[0];
  } else {
    slug = link.split("/").pop() || "";
  }
  
  let apiUrl = "";
  if (isSeries) {
    // If it's a numeric ID from legacy links, we might need a different logic, 
    // but for now we try to use it as a slug.
    apiUrl = `${baseUrl}/api/series/${slug}`;
  } else {
    apiUrl = `${baseUrl}/api/movies?slug=${slug}`;
  }

  try {
    const res = await axios.get(apiUrl, {
      headers: {
        ...commonHeaders,
        Referer: baseUrl,
        "X-Requested-With": "XMLHttpRequest",
      },
    });

    const data = res.data;
    if (!data) throw new Error("No data found");

    const info: Info = {
      title: data.title || "",
      image: data.posterUrl || data.backdropUrl || DEFAULT_IMAGE,
      synopsis: data.overview || data.description || "",
      imdbId: data.imdbId || "", // Might be empty, but that's okay
      type: isSeries ? "series" : "movie",
      rating: data.rating?.toString(),
      cast: data.cast?.map((c: any) => c.name),
      linkList: [],
    };

    if (isSeries) {
      // For series, we provide an episodes link that will be handled by GetEpisodeLinks
      info.linkList.push({
        title: "Default",
        episodesLink: link, // Pass the original link, GetEpisodeLinks will handle it
      });
    } else {
      // For movies, we provide direct links
      const directLinks = (data.embeds || []).map((embed: any) => ({
        title: embed.label || "Server",
        link: embed.url,
        type: "movie" as const,
      }));

      info.linkList.push({
        title: "Default",
        directLinks,
      });
    }

    return info;
  } catch (error) {
    console.error(`Fanbroj getMetaData Error: ${error}`);
    return {
      title: "",
      image: "",
      synopsis: "",
      imdbId: "",
      type: "movie",
      linkList: [],
    };
  }
};

// Backward compatibility
export const getMetaData = getMeta;
