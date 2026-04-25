import { EpisodeLink, ProviderContext } from "../types";

export const getEpisodes = async function ({
  url,
  providerContext,
}: {
  url: string;
  providerContext: ProviderContext;
}): Promise<EpisodeLink[]> {
  console.log(`[Fanbroj] Fetching Episodes (v3.4.5) for: ${url}`);
  const { axios, commonHeaders } = providerContext;
  const baseUrl = "https://fanbroj.net";

  // url format: /series/[slug] or legacy /series_episodes.php?id=[id]
  let slug = "";
  if (url.includes("id=")) {
    slug = url.split("id=")[1].split("&")[0];
  } else {
    slug = url.split("/").pop() || "";
  }

  const apiUrl = `${baseUrl}/api/series/${slug}/episodes`;

  try {
    const res = await axios.get(apiUrl, {
      headers: {
        ...commonHeaders,
        Referer: baseUrl,
        "X-Requested-With": "XMLHttpRequest",
      },
    });

    const data = res.data;
    if (!data) return [];

    const episodes: EpisodeLink[] = [];

    // data is a map of season numbers to arrays of episodes
    Object.keys(data).forEach((season) => {
      const seasonEpisodes = data[season];
      if (Array.isArray(seasonEpisodes)) {
        seasonEpisodes.forEach((ep: any) => {
          // If there are multiple embeds, we'll just use the first one for now
          // or we could potentially return multiple links per episode if the interface supported it.
          // Since EpisodeLink only has title and link, we'll use the embed URL directly.
          if (ep.embeds && ep.embeds.length > 0) {
            episodes.push({
              title: `S${season} E${ep.episodeNumber}: ${ep.title}`,
              link: ep.embeds[0].url, // This will be passed to getStream
            });
          }
        });
      }
    });

    return episodes;
  } catch (error) {
    console.error(`Fanbroj getEpisodeLinks Error: ${error}`);
    return [];
  }
};

// Backward compatibility
export const getEpisodeLinks = getEpisodes;
