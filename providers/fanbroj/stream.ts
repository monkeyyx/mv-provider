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
    const videoUrl = data.videoSource || data.securedLink;
    const fallbackUrl = data.securedLink;

    // Decode the 'ck' session value if present
    const ck = data.ck || "";
    let decodedCk = ck;
    if (ck.includes("\\x")) {
      try {
        decodedCk = ck.replace(/\\x([0-9a-fA-F]{2})/g, (_: any, hex: string) =>
          String.fromCharCode(parseInt(hex, 16))
        );
      } catch (e) {
        console.error("Fanbroj ck decode error", e);
      }
    }

    const commonStreamHeaders = {
      Referer: link,
      Origin: host,
      "User-Agent":
        commonHeaders["User-Agent"] ||
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "X-Requested-With": "XMLHttpRequest",
      ...(decodedCk && {
        Cookie: decodedCk.includes("fire_ck=")
          ? decodedCk
          : `fire_ck=${decodedCk}`,
      }),
    };

    // Primary stream
    if (videoUrl) {
      streams.push({
        server: "Fire-HLS (Primary)",
        link: videoUrl,
        type: videoUrl.includes(".m3u8") || data.hls ? "m3u8" : "mp4",
        quality: "1080",
        headers: commonStreamHeaders,
      });
    }

    // Fallback stream
    if (fallbackUrl && fallbackUrl !== videoUrl) {
      streams.push({
        server: "Fire-HLS (Backup)",
        link: fallbackUrl,
        type: fallbackUrl.includes(".m3u8") || data.hls ? "m3u8" : "mp4",
        quality: "1080",
        headers: commonStreamHeaders,
      });
    }

    return streams;
  } catch (error) {
    console.error(`Fanbroj getStream Error: ${error}`);
    return [];
  }
};
