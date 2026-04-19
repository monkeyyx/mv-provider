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

  // Handle proxy links from the API to avoid Network Errors from invalid URLs
  if (link.startsWith("proxy_id::")) {
    const [_, type, id, title, image, stream] = link.split("::");
    const isSeries = type === "series";

    return {
      title: title || "Govix TV Content",
      image: image || "",
      synopsis: "No synopsis available for this content.",
      imdbId: "",
      type: isSeries ? "series" : "movie",
      linkList: [
        {
          title: isSeries ? "Seasons" : "Stream",
          episodesLink: isSeries ? link : undefined,
          directLinks: isSeries ? [] : [
            {
              title: "Watch Direct",
              link: stream || link,
              type: "movie",
            }
          ]
        }
      ]
    };
  }

  const fullUrl = link.startsWith("http") ? link : `${baseUrl}${link}`;

  try {
    const desktopUA =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
    const res = await axios.get(fullUrl, {
      headers: {
        "User-Agent": desktopUA,
        "sec-ch-ua":
          '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        Referer: baseUrl,
        "X-Requested-With": "XMLHttpRequest",
        Cookie: "", // Strictly no cookies (Incognito Mode)
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
