import { EpisodeLink, ProviderContext } from "../types";

export const getEpisodes = async function ({
  url,
  providerContext,
}: {
  url: string;
  providerContext: ProviderContext;
}): Promise<EpisodeLink[]> {
  const { axios, cheerio, getBaseUrl, commonHeaders } = providerContext;
  const baseUrl = (await getBaseUrl("govixtv")) || "https://www.govixtv.com";

  const fullUrl = url.startsWith("http") ? url : `${baseUrl}${url}`;

  try {
    const res = await axios.get(fullUrl, { headers: commonHeaders });
    const $ = cheerio.load(res.data);
    const episodes: EpisodeLink[] = [];

    // Updated selectors for GovixTV series episodes page
    $(".episode-col").each((_, element) => {
      const el = $(element);
      const title = el.find(".episode-title").text().trim();
      const relativeLink = el.find("a.btn-watch").attr("href") || "";

      if (title && relativeLink) {
        const fullEpLink = relativeLink.startsWith("http")
          ? relativeLink
          : `${baseUrl}/${relativeLink.replace(/^\//, "")}`;

        episodes.push({
          title,
          link: fullEpLink,
        });
      }
    });

    return episodes;
  } catch (error) {
    console.error(`GovixTV getEpisodes Error: ${error}`);
    return [];
  }
};
