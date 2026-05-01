import { ProviderContext, Post } from "../types";

export async function getPosts({
  page,
  type,
  signal,
  providerContext,
}: {
  page: number;
  type: string;
  signal: AbortSignal;
  providerContext: ProviderContext;
}): Promise<Post[]> {
  const { axios } = providerContext;

  // Cineby doesn't have a public "catalog" we can scrape easily from JS
  // without a backend or TMDB API key. We will use TMDB trending as a fallback
  // since Cineby supports almost everything on TMDB.

  const tmdbType = type === "movie" ? "movie" : "tv";
  const url = `https://api.themoviedb.org/3/trending/${tmdbType}/week?api_key=84105ee2155bc9837f48028782ee2f94&page=${page}`;

  try {
    const resp = await axios.get(url, { signal });
    return resp.data.results.map((item: any) => ({
      title: item.title || item.name,
      link: `tmdb:${item.id}`,
      image: `https://image.tmdb.org/t/p/w500${item.poster_path}`,
      provider: "cineby",
    }));
  } catch (e) {
    return [];
  }
}
