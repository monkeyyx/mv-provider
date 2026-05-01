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

  // link is an IMDB ID like "tt7602722"
  const id = link.startsWith("tmdb:") ? link.split(":")[1] : link;

  try {
    // Cinemeta provides full series metadata with all episodes
    const url = `https://v3-cinemeta.strem.io/meta/series/${id}.json`;
    const resp = await axios.get(url, { signal });
    const meta = resp.data?.meta;

    if (!meta || !meta.videos) return [];

    const episodes: EpisodeLink[] = [];
    for (const video of meta.videos) {
      if (video.season === 0) continue; // Skip specials
      episodes.push({
        title: `S${video.season}E${video.episode} - ${video.name || video.title || ""}`.trim(),
        link: `${id}:${video.season}:${video.episode}`,
      });
    }

    return episodes;
  } catch (e) {
    console.error("[HDToday] getEpisodeLinks error:", e);
    return [];
  }
}
