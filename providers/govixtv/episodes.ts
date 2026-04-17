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
    const mobileUA = "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36";
    const res = await axios.get(fullUrl, {
      headers: {
        "User-Agent": mobileUA,
        "sec-ch-ua": '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        "sec-ch-ua-mobile": "?1",
        "sec-ch-ua-platform": '"Android"',
        Cookie: "", // Strictly no cookies
      },
    });
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
