import { ProviderContext, Info } from "../types";

export async function getMeta({
  link,
  type,
  signal,
  providerContext,
}: {
  link: string;
  type: string;
  signal: AbortSignal;
  providerContext: ProviderContext;
}): Promise<Info | null> {
  const { axios } = providerContext;
  const tmdbId = link.split(":").pop();
  const mediaType = type === "movie" ? "movie" : "tv";

  try {
    const url = `https://api.themoviedb.org/3/${mediaType}/${tmdbId}?api_key=84105ee2155bc9837f48028782ee2f94&append_to_response=external_ids`;
    const resp = await axios.get(url, { signal });
    const data = resp.data;

    return {
      title: data.title || data.name,
      image: `https://image.tmdb.org/t/p/w500${data.poster_path}`,
      synopsis: data.overview,
      imdbId: data.external_ids?.imdb_id || "",
      type: type,
      linkList: [], // Handled by episodes context if series
    };
  } catch (e) {
    return null;
  }
}
