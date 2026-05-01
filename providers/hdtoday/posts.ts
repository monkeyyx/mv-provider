import { Post, ProviderContext } from "../types";

// Use Cinemeta catalog for discovery - no API key needed
const CINEMETA_BASE = "https://v3-cinemeta.strem.io";

export const getPosts = async ({
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
}): Promise<Post[]> => {
  try {
    const { axios } = providerContext;

    // Cinemeta catalog endpoints:
    // /catalog/movie/top.json          (Top movies)
    // /catalog/series/top.json         (Top series)
    // /catalog/movie/year-2024.json    (Movies by year)
    // /catalog/movie/imdbRating.json   (By IMDB rating)
    const url = `${CINEMETA_BASE}/catalog/${filter}.json${page > 1 ? `?skip=${(page - 1) * 20}` : ""}`;

    const res = await axios.get(url, { signal });
    const metas = res.data?.metas || [];

    return metas.map((item: any) => ({
      title: item.name,
      link: item.id, // IMDB ID like "tt0816692"
      image: item.poster || "",
      provider: providerValue,
    })).filter((post: Post) => post.image !== "");
  } catch (error) {
    console.error("HDToday getPosts error:", error);
    return [];
  }
};

export const getSearchPosts = async ({
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
}): Promise<Post[]> => {
  try {
    const { axios } = providerContext;

    // Cinemeta search endpoint
    const [movieRes, seriesRes] = await Promise.all([
      axios.get(`${CINEMETA_BASE}/catalog/movie/top/search=${encodeURIComponent(searchQuery)}.json`, { signal }).catch(() => ({ data: { metas: [] } })),
      axios.get(`${CINEMETA_BASE}/catalog/series/top/search=${encodeURIComponent(searchQuery)}.json`, { signal }).catch(() => ({ data: { metas: [] } })),
    ]);

    const movies = (movieRes.data?.metas || []).map((item: any) => ({
      title: item.name,
      link: item.id,
      image: item.poster || "",
      provider: providerValue,
    }));

    const series = (seriesRes.data?.metas || []).map((item: any) => ({
      title: item.name,
      link: item.id,
      image: item.poster || "",
      provider: providerValue,
    }));

    return [...movies, ...series].filter((post) => post.image !== "");
  } catch (error) {
    console.error("HDToday getSearchPosts error:", error);
    return [];
  }
};
