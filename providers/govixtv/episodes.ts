import { EpisodeLink, ProviderContext } from "../types";

export const getEpisodes = async function ({
  url,
  providerContext,
}: {
  url: string;
  providerContext: ProviderContext;
}): Promise<EpisodeLink[]> {
  const { axios } = providerContext;

  try {
    // Check if it's a proxy link
    if (url.startsWith("proxy_id:")) {
      const parts = url.split("::");
      const id = parts.length > 2 ? parts[2] : url.replace("proxy_id:", "");
      
      const res = await axios.get(`https://test.xaliye4.online/api/series-videos/${id}`, {
        headers: {
          "ppkey": "Hg4fPewbcGfBTskQQE5mktC2vgEHT9GX",
          "User-Agent": "SoodagLives/1.1",
        }
      });

      const data = res.data;
      if (!Array.isArray(data)) return [];

      return data.map((item: any) => ({
        title: item.title,
        link: item.m3u8_link, // The API returns the direct M3U8 link!
      }));
    }

    // Fallback to legacy scraping (if still needed)
    const baseUrl = (await providerContext.getBaseUrl("govixtv")) || "https://www.govixtv.com";
    const fullUrl = url.startsWith("http") ? url : `${baseUrl}${url}`;
    
    const desktopUA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
    const res = await axios.get(fullUrl, {
      headers: {
        "User-Agent": desktopUA,
        Cookie: "", 
      },
    });
    const $ = providerContext.cheerio.load(res.data);
    const episodes: EpisodeLink[] = [];

    $(".episode-col").each((_, element) => {
      const el = $(element);
      const title = el.find(".episode-title").text().trim();
      const relativeLink = el.find("a.btn-watch").attr("href") || "";

      if (title && relativeLink) {
        episodes.push({
          title,
          link: relativeLink.startsWith("http") ? relativeLink : `${baseUrl}/${relativeLink.replace(/^\//, "")}`,
        });
      }
    });

    return episodes;
  } catch (error) {
    console.error(`GovixTV getEpisodes Error: ${error}`);
    return [];
  }
};

