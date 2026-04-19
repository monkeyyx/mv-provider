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
  const { axios, cheerio, getBaseUrl } = providerContext;
  const baseUrl = (await getBaseUrl(providerValue)) || "https://www.govixtv.com";

  if (page > 1) return [];

  const url = `${baseUrl}${filter}`;
  try {
    const desktopUA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
    const res = await axios.get(url, {
      headers: {
        "User-Agent": desktopUA,
        Referer: baseUrl,
        Cookie: "", 
      },
      signal,
    });

    const $ = cheerio.load(res.data);
    const posts: Post[] = [];

    // Scrape Movies
    $(".movie-col .movie-card").each((_, element) => {
      const el = $(element);
      const title = el.find(".card-title").text().trim();
      const image = el.find("img.movie-poster").attr("data-src") || el.find("img.movie-poster").attr("src") || "";
      const relativeLink = el.find("a.btn-play").attr("href") || "";

      if (title && relativeLink) {
        posts.push({
          title,
          image,
          link: relativeLink.startsWith("/") ? relativeLink : `/${relativeLink}`,
          provider: providerValue,
        });
      }
    });

    // Scrape Series
    $(".series-card").each((_, element) => {
      const el = $(element);
      const title = el.find(".series-title").text().trim();
      const image = el.find("img.series-poster").attr("data-src") || el.find("img.series-poster").attr("src") || "";
      const relativeLink = el.find("a.btn-episodes").attr("href") || "";

      if (title && relativeLink) {
        posts.push({
          title,
          image,
          link: relativeLink.startsWith("/") ? relativeLink : `/${relativeLink}`,
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

