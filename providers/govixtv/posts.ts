import { Post, ProviderContext } from "../types";

export const getPosts = async function ({
  filter,
  page,
  providerValue,
  signal,
  providerContext,
}: {
  filter: string;
  page: number;
  providerValue: string;
  signal: AbortSignal;
  providerContext: ProviderContext;
}): Promise<Post[]> {
  const { axios, cheerio, getBaseUrl, commonHeaders } = providerContext;
  const baseUrl =
    (await getBaseUrl(providerValue)) || "https://www.govixtv.com";

  if (page > 1) {
    return [];
  }

  const url = `${baseUrl}${filter}`;

  try {
    const desktopUA =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
    const res = await axios.get(url, {
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
      signal,
    });
    const $ = cheerio.load(res.data);
    const posts: Post[] = [];

    // Parse Movie Cards
    $(".movie-col .movie-card").each((_, element) => {
      const el = $(element);
      const title = el.find(".card-title").text().trim();
      const image = el.find("img.movie-poster").attr("data-src") || "";
      const relativeLink = el.find("a.btn-play").attr("href") || "";

      if (title && relativeLink) {
        posts.push({
          title,
          image,
          link: relativeLink.startsWith("/")
            ? relativeLink
            : `/${relativeLink}`,
          provider: providerValue,
        });
      }
    });

    // Parse Series Cards (Musasal)
    $(".series-card").each((_, element) => {
      const el = $(element);
      const title = el.find(".series-title").text().trim();
      const image = el.find("img.series-poster").attr("data-src") || "";
      const relativeLink = el.find("a.btn-episodes").attr("href") || "";

      if (title && relativeLink) {
        posts.push({
          title,
          image,
          link: relativeLink.startsWith("/")
            ? relativeLink
            : `/${relativeLink}`,
          provider: providerValue,
        });
      }
    });

    return posts;
  } catch (error) {
    console.error(`GovixTV getPosts Error: ${error}`);
    return [];
  }
};

export const getSearchPosts = async function ({
  searchQuery,
  page,
  providerValue,
  signal,
  providerContext,
}: {
  searchQuery: string;
  page: number;
  providerValue: string;
  signal: AbortSignal;
  providerContext: ProviderContext;
}): Promise<Post[]> {
  return [];
};
