import { ProviderContext, Stream } from "../types";

const BACKEND_BASE = "http://145.241.158.129:3112";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

export const GetStream = async ({
  link,
  type,
  signal,
  providerContext,
}: {
  link: string; // The TMDB ID should be passed in the link or extracted
  type: string; // "movie" or "series"
  signal: AbortSignal;
  providerContext: ProviderContext;
}): Promise<Stream[]> => {
  const t0 = Date.now();
  const mediaType = type === "movie" ? "movie" : "series";
  
  // Link might be just the TMDB ID, or a serialized string (e.g. "tmdbId:season:episode")
  // For simplicity, we'll assume it's passed safely. In a real app, you'd parse `link`
  const idStr = link;
  
  console.log(`[FaselHD] === ${mediaType}/${idStr} ===`);

  try {
    const url = `${BACKEND_BASE}/resolve/${mediaType}/${idStr}`;
    const response = await fetch(url, {
      signal,
      headers: {
        "User-Agent": UA,
        ...providerContext.commonHeaders,
      },
    });

    if (!response.ok) {
      console.log(`[FaselHD] Backend returned ${response.status}`);
      return [];
    }

    const data = await response.json();
    const streamsData = data.streams || [];
    
    console.log(`[FaselHD] === Done: ${streamsData.length} streams in ${Date.now() - t0}ms ===`);
    
    // Map the returned streams to the Stream[] interface
    const streams: Stream[] = streamsData.map((s: any) => ({
      server: s.server || s.name || "FaselHD",
      link: s.url || s.link,
      type: s.type || "m3u8",
      quality: s.quality || "Unknown",
    }));

    return streams;
  } catch (error: any) {
    console.log(`[FaselHD] Error: ${error.message}`);
    return [];
  }
};
