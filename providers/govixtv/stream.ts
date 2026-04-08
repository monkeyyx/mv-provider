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
  const { axios, getBaseUrl, commonHeaders } = providerContext;
  const baseUrl = (await getBaseUrl("govixtv")) || "https://www.govixtv.com";

  const fullUrl = link.startsWith("http")
    ? link
    : `${baseUrl}${link.startsWith("/") ? "" : "/"}${link}`;
  const streams: Stream[] = [];

  try {
    const idMatch = fullUrl.match(/id=(\d+)/);
    const mediaId = idMatch ? idMatch[1] : "";

    const mobileUA = "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36";
    const mobileHeaders = {
      ...commonHeaders,
      "User-Agent": mobileUA,
      "sec-ch-ua": '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
      "sec-ch-ua-mobile": "?1",
      "sec-ch-ua-platform": '"Android"',
    };

    // Step 1: GET to establish session (cookies are now ignored to avoid restrictions)
    const getRes = await axios.get(fullUrl, {
      headers: {
        ...mobileHeaders,
        Referer: baseUrl,
        "X-Requested-With": "XMLHttpRequest",
      },
      signal,
    });

    // Step 2: POST to bypass phone verification using 6112345678
    const postData = `phone=6112345678&full_number=2526112345678${mediaId ? `&id=${mediaId}` : ""}`;

    const res = await axios.post(fullUrl, postData, {
      headers: {
        ...mobileHeaders,
        "Content-Type": "application/x-www-form-urlencoded",
        Referer: fullUrl,
        Origin: baseUrl,
        "X-Requested-With": "XMLHttpRequest",
      },
      signal,
    });

    const html = res.data;

    // Extraction Logic: Look for .m3u8 links
    const m3u8Regex =
      /"(https?:\/\/[^"]+\.m3u8[^"]*)"|'(https?:\/\/[^']+\.m3u8[^']*)'|(?<=file\s*:\s*)(https?:\/\/[^\s,}]+\.m3u8[^\s,}]*)/gi;
    let match;
    const foundUrls = new Set<string>();

    while ((match = m3u8Regex.exec(html)) !== null) {
      const rawUrl = match[1] || match[2] || match[3];
      if (rawUrl && !foundUrls.has(rawUrl)) {
        foundUrls.add(rawUrl);

        streams.push({
          server: 'Govix-HLS',
          link: rawUrl, // Preserve query parameters (tokens/sigs)
          type: 'hls',
          headers: {
            Cookie: '', // Stream host rejects session cookies
            Referer: 'https://www.govixtv.com/',
            Origin: 'https://www.govixtv.com',
            "User-Agent": mobileUA,
          },
          quality: '1080',
        });
      }
    }

    return streams;
  } catch (error) {
    console.error(`GovixTV getStream Error: ${error}`);
    return [];
  }
};
