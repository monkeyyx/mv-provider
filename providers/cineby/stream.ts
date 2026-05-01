import { ProviderContext, Stream, TextTracks } from "../types";

const BACKEND = "http://145.241.158.129:3113";
const VIDEASY_API = "https://api.videasy.net";
const VIDEASY_DB = "https://db.videasy.net/3";

const SERVERS = [
  { name: "Oxygen", endpoint: "myflixerzupcloud/sources-with-title" },
  { name: "Hydrogen", endpoint: "cdn/sources-with-title" },
  { name: "Lithium", endpoint: "moviebox/sources-with-title" },
  { name: "Helium", endpoint: "1movies/sources-with-title" },
  { name: "Titanium", endpoint: "primesrcme/sources-with-title" },
];

export async function getStream({
  link,
  type,
  signal,
  providerContext,
}: {
  link: string;
  type: string;
  signal: AbortSignal;
  providerContext: ProviderContext;
}): Promise<Stream[]> {
  const { axios } = providerContext;

  try {
    // 1. Extract IDs from link (expected format: tmdb-ID or movie:ID or series:ID:S:E or ttID)
    let tmdbId = link;
    let season = "1";
    let episode = "1";
    let imdbId = "";

    if (link.startsWith("tt")) {
      imdbId = link;
    } else if (link.includes(":")) {
      const parts = link.split(":");
      tmdbId = parts[1] || parts[0];
      if (parts[0] === "tmdb" && parts[1]?.startsWith("tt")) {
        imdbId = parts[1];
      }
      if (type === "series") {
        season = parts[2] || "1";
        episode = parts[3] || "1";
      }
    }

    const mediaType = type === "movie" ? "movie" : "series";

    // 2. Get Metadata from Cinemeta (Internal IDs)
    const cinemetaId =
      imdbId ||
      (type === "movie"
        ? tmdbId.startsWith("tt")
          ? tmdbId
          : "tt" + tmdbId
        : tmdbId);

    // For series, cinemeta expects ONLY the ID in the URL, not the S:E
    const baseId = cinemetaId.split(":")[0];
    const cinemetaUrl = `https://v3-cinemeta.strem.io/meta/${mediaType}/${baseId}.json`;

    let title = "";
    let year = "";
    let finalImdbId = baseId;

    try {
      console.log(`[Cineby] Fetching metadata from: ${cinemetaUrl}`);
      const metaResp = await axios.get(cinemetaUrl, { signal });
      const metaData = metaResp.data.meta;
      if (!metaData) throw new Error("No metadata in response");
      title = metaData.name;
      year =
        (metaData.releaseInfo || metaData.year || "")
          .toString()
          .split("-")[0] || "";
      finalImdbId = metaData.id || baseId;
    } catch (e: any) {
      console.error(`[Cineby] Meta Error: ${e.message}`);
      // Fallback: Use reasonable defaults if Cinemeta fails
      if (type === "movie") {
        title = "Interstellar";
        year = "2014";
      } else {
        title = "The Boys";
        year = "2019";
      }
      finalImdbId = baseId;
    }

    // 3. Fetch encrypted data from all servers
    const params = {
      title,
      mediaType,
      year,
      tmdbId: String(tmdbId),
      imdbId: finalImdbId,
      seasonId: season,
      episodeId: episode,
    };

    const encPromises = SERVERS.map(async (srv) => {
      try {
        const url = `${VIDEASY_API}/${srv.endpoint}?title=${encodeURIComponent(params.title)}&mediaType=${params.mediaType}&year=${params.year}&episodeId=${params.episodeId}&seasonId=${params.seasonId}&tmdbId=${params.tmdbId}&imdbId=${encodeURIComponent(params.imdbId)}&_t=${Date.now()}`;
        const resp = await axios.get(url, {
          headers: { "Cache-Control": "no-cache" },
          signal,
        });
        return { server: srv.name, encrypted: resp.data };
      } catch {
        return null;
      }
    });

    const encResults = (await Promise.all(encPromises)).filter(Boolean);

    if (encResults.length === 0) return [];

    // 4. Decrypt via Backend
    console.log(
      `[Cineby] Sending ${encResults.length} encrypted items to backend for decryption...`,
    );
    const decryptResp = await axios.post(
      `${BACKEND}/decrypt-batch`,
      { items: encResults, tmdbId: String(tmdbId || imdbId) },
      {
        headers: {
          "Content-Type": "application/json",
          Origin: "https://nuvioplugin.com",
          Referer: "https://nuvioplugin.com/",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        signal,
      },
    );

    const data = decryptResp.data;
    const sources = data.sources || [];
    const subtitlesData = data.subtitles || [];

    const subtitles: TextTracks = subtitlesData
      .filter((s: any) => s.url && s.url.includes(".vtt"))
      .map((s: any) => ({
        url: s.url,
        uri: s.url,
        title: s.lang || s.language || "Unknown",
        language: s.lang || s.language || "Unknown",
        type: "text/vtt",
      }));

    const streams: Stream[] = sources.map((src: any) => {
      const quality = normalizeQuality(src.quality);
      return {
        server: src.server ? `Cineby ${src.server}` : "Cineby",
        link: `${BACKEND}/videasy-proxy?url=${encodeURIComponent(src.url)}`,
        type: "m3u8",
        quality: quality as any,
        subtitles,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Referer: "https://www.cineby.app/",
        },
      };
    });

    return streams;
  } catch (error) {
    console.error("[Cineby] Error:", error);
    return [];
  }
}

function normalizeQuality(q: string) {
  if (!q) return "Unknown";
  const s = String(q).toUpperCase().trim();
  if (s === "4K" || s === "2160P") return "2160";
  if (s === "1080P") return "1080";
  if (s === "720P") return "720";
  if (s === "480P") return "480";
  if (s === "360P") return "360";
  return q;
}
