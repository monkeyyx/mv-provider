import { ProviderContext, Post } from "../types";

export async function getPosts({
  search,
  type,
  signal,
  providerContext,
}: {
  search: string;
  type: string;
  signal: AbortSignal;
  providerContext: ProviderContext;
}): Promise<Post[]> {
  const { axios } = providerContext;
  const tmdbType = type === "movie" ? "movie" : "tv";
  const url = `https://api.themoviedb.org/3/search/${tmdbType}?api_key=84105ee2155bc9837f48028782ee2f94&query=${encodeURIComponent(search)}`;

  try {
    const resp = await axios.get(url, { signal });
    // console.log("TMDB Resp:", JSON.stringify(resp.data).substring(0, 100));
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
