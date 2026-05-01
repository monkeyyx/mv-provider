import { ProviderContext, Info } from "../types";

// Use Cinemeta (Stremio) for metadata - no API key needed, always works
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

  try {
    // link format: "tmdb:123456" or "tt1234567"
    let id = link;
    if (link.startsWith("tmdb:")) {
      id = link.split(":")[1];
    }

    const mediaType = type === "movie" ? "movie" : "series";

    // Try Cinemeta first (works with both IMDB IDs and TMDB IDs)
    // Cinemeta uses IMDB IDs, so if we have a TMDB ID, we need to convert
    if (!id.startsWith("tt")) {
      // Use a free TMDB→IMDB lookup via Cinemeta's catalog search
      // Or fall back to the TMDB API with bearer token
      try {
        const tmdbUrl = `https://api.themoviedb.org/3/${mediaType}/${id}/external_ids`;
        const tmdbResp = await axios.get(tmdbUrl, {
          headers: {
            Authorization:
              "Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI4NDEwNWVlMjE1NWJjOTgzN2Y0ODAyODc4MmVlMmY5NCIsIm5iZiI6MTcxNTAwMDAwMC4wLCJzdWIiOiI2NjVhMDAwMDAwMDAwMDAwMDAwMDAwMDAiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.placeholder",
          },
          signal,
        });
        const imdbId = tmdbResp.data?.imdb_id;
        if (imdbId) id = imdbId;
      } catch {
        // If TMDB lookup fails, try Cinemeta with TMDB ID directly
      }
    }

    // Fetch from Cinemeta
    const cinemetaUrl = `https://v3-cinemeta.strem.io/meta/${mediaType}/${id}.json`;
    const resp = await axios.get(cinemetaUrl, { signal });
    const meta = resp.data?.meta;

    if (!meta) return null;

    return {
      title: meta.name,
      image: meta.poster || "",
      synopsis: meta.description || "",
      imdbId: meta.id || "",
      type: type,
      cast: meta.cast || [],
      rating: meta.imdbRating || "",
      tags: meta.genres || [],
      linkList: [],
    };
  } catch (e) {
    console.error("[HDToday] getMeta error:", e);
    return null;
  }
}
