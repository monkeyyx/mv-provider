import { ProviderContext, Stream } from "../types";

export const getStream = async function ({
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
  const { axios, commonHeaders } = providerContext;
  
  // link format: https://xamaali.cfd/video/[id] or https://idaawo.xyz/video/[id]
  const idMatch = link.match(/\/video\/([a-zA-Z0-9]+)/);
  const id = idMatch ? idMatch[1] : "";
  
  if (!id) return [];

  const host = new URL(link).origin;
  const playerUrl = `${host}/player/index.php?data=${id}&do=getVideo`;

  try {
    // We need to bypass the player protection by sending a POST with the correct Referer
    // and potentially other headers.
    const res = await axios.post(
      playerUrl,
      `data=${id}&do=getVideo`,
      {
        headers: {
          ...commonHeaders,
          "Content-Type": "application/x-www-form-urlencoded",
          "X-Requested-With": "XMLHttpRequest",
          Referer: link, // The player page itself
          Origin: host,
        },
        signal,
      }
    );

    const data = res.data;
    if (!data || !data.videoSource) {
      console.error("Fanbroj Stream Error: No videoSource found", data);
      return [];
    }

    const streams: Stream[] = [];
    const videoUrl = data.securedLink || data.videoSource;

    // The videoSource is usually a .txt manifest which is actually an M3U8.
    // We need to pass the headers (UA & Referer) to the player so it can fetch segments.
    // Decode the 'ck' session value if present
    const ck = data.ck || "";
    const decodedCk = ck.includes("\\x") 
      ? ck.replace(/\\x([0-9a-fA-F]{2})/g, (_: any, hex: string) => String.fromCharCode(parseInt(hex, 16)))
      : ck;

    streams.push({
      server: "Fire-HLS",
      link: videoUrl,
      type: "m3u8",
      quality: "1080",
      headers: {
        Referer: link, // Use full link as referer for both manifest and segments
        "User-Agent": commonHeaders["User-Agent"] || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        ...(decodedCk && { Cookie: `fire_ck=${decodedCk}` }),
      },
    });

    return streams;
  } catch (error) {
    console.error(`Fanbroj getStream Error: ${error}`);
    return [];
  }
};
