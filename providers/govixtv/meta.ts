import { Info, ProviderContext } from "../types";

export const getMeta = async function ({
  link,
  provider,
  providerContext,
}: {
  link: string;
  provider: string;
  providerContext: ProviderContext;
}): Promise<Info> {
  const { axios, cheerio, getBaseUrl, commonHeaders } = providerContext;
  const baseUrl = (await getBaseUrl(provider)) || "https://www.govixtv.com";

  const fullUrl = link.startsWith("http") ? link : `${baseUrl}${link}`;

  try {
    const res = await axios.get(fullUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
        "sec-ch-ua": '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        "sec-ch-ua-mobile": "?1",
        "sec-ch-ua-platform": '"Android"',
        Referer: baseUrl,
        "X-Requested-With": "XMLHttpRequest",
      },
    });
    const $ = cheerio.load(res.data);

    const isSeries =
      fullUrl.includes("series_episodes.php") ||
      fullUrl.includes("musasal.php");
    const title =
      $("title").text().replace("- Govix TV", "").trim() || "Govix TV Content";

    let image = $("video#player").attr("poster") || "";
    if (!image) {
      image = $('meta[property="og:image"]').attr("content") || "";
    }

    const info: Info = {
      title,
      image,
      synopsis: "",
      imdbId: "",
      type: isSeries ? "series" : "movie",
      linkList: [
        {
          title: isSeries ? "Seasons" : "Stream",
          episodesLink: isSeries ? fullUrl : undefined,
          directLinks: [
            {
              title: isSeries ? "View Episodes" : "Watch Direct",
              link: fullUrl,
              type: isSeries ? "series" : "movie",
            },
          ],
        },
      ],
    };

    return info;
  } catch (error) {
    console.error(`GovixTV getMeta Error: ${error}`);
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
