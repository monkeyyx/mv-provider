import { EpisodeLink, ProviderContext } from "../types";

export async function getEpisodes({
  url,
  providerContext,
}: {
  url: string;
  providerContext: ProviderContext;
}): Promise<EpisodeLink[]> {
  const { axios } = providerContext;
  try {
    const response = await axios.get(url);
    const episodes = response.data.episodes || [];
    const seriesId = response.data.id;
    
    return episodes.map((ep: any, index: number) => ({
      title: ep.title || `Episode ${index + 1}`,
      link: `series_id=${seriesId}&episode_index=${index}`,
    }));
  } catch (error) {
    console.error("turkmood getEpisodeLinks error:", error);
    return [];
  }
}
