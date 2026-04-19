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
  const { axios } = providerContext;

  if (page > 1) {
    return [];
  }

  // Map filters to API endpoints
  // Movies: /movie.php -> https://test.xaliye4.online/api/movies?page=all
  // Series: /musasal.php -> https://test.xaliye4.online/api/series
  const apiEndpoint = filter.includes("movie") 
    ? "https://test.xaliye4.online/api/movies?page=all" 
    : "https://test.xaliye4.online/api/series";

  try {
    const res = await axios.get(apiEndpoint, {
      headers: {
        "ppkey": "Hg4fPewbcGfBTskQQE5mktC2vgEHT9GX", // Discovered in Suu Player APK
        "User-Agent": "SoodagLives/1.1",
      },
      signal,
    });

    const data = res.data;
    if (!Array.isArray(data)) return [];

    return data.map((item: any) => ({
      title: item.title,
      image: item.logo || "",
      // Use a structured proxy link to pass metadata downstream avoiding extra scraping
      link: `proxy_id::${item.type || (filter.includes("movie") ? "movie" : "series")}::${item.id}::${item.title}::${item.logo || ""}::${item.m3u8_link || ""}`,
      provider: providerValue,
    }));

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

