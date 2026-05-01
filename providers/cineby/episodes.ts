import { ProviderContext, EpisodeLink } from "../types";

export async function getEpisodeLinks({
  link,
  signal,
  providerContext,
}: {
  link: string;
  signal: AbortSignal;
  providerContext: ProviderContext;
}): Promise<EpisodeLink[]> {
  const { axios } = providerContext;
  const tmdbId = link.split(":").pop();

  try {
    // Fetch seasons to get episode counts
    const url = `https://api.themoviedb.org/3/tv/${tmdbId}?api_key=84105ee2155bc9837f48028782ee2f94`;
    const resp = await axios.get(url, { signal });
    const data = resp.data;

    const episodes: EpisodeLink[] = [];
    for (const season of data.seasons) {
      if (season.season_number === 0) continue; // Skip specials
      for (let i = 1; i <= season.episode_count; i++) {
        episodes.push({
          title: `Season ${season.season_number} Episode ${i}`,
          link: `tmdb:${tmdbId}:${season.season_number}:${i}`,
        });
      }
    }
    return episodes;
  } catch (e) {
    return [];
  }
}
