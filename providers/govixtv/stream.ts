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

    // Step 1: GET to establish session
    await axios.get(fullUrl, {
      headers: {
        ...commonHeaders,
        Referer: baseUrl,
      },
      signal,
    });

    // Step 2: POST to bypass phone verification
    const postData = `phone=615123456&full_number=252615123456${mediaId ? `&id=${mediaId}` : ""}`;

    const res = await axios.post(fullUrl, postData, {
      headers: {
        ...commonHeaders,
        "Content-Type": "application/x-www-form-urlencoded",
        Referer: fullUrl,
        Origin: baseUrl,
      },
      signal,
    });

    const html = res.data;

    // Extraction Logic: Look for .m3u8 links in hls.loadSource, video.src, or window variables
    // Improved regex to handle escaped quotes, no quotes, and multiple sources
    const m3u8Regex =
      /"(https?:\/\/[^"]+\.m3u8[^"]*)"|'(https?:\/\/[^']+\.m3u8[^']*)'|(?<=file\s*:\s*)(https?:\/\/[^\s,}]+\.m3u8[^\s,}]*)/gi;
    let match;
    const foundUrls = new Set<string>();

    while ((match = m3u8Regex.exec(html)) !== null) {
      const url = match[1] || match[2] || match[3];
      if (url && !foundUrls.has(url)) {
        foundUrls.add(url);
        streams.push({
          server: "Govix-HLS",
          link: url,
          type: "hls",
          quality: "1080",
        });
      }
    }

    return streams;
  } catch (error) {
    console.error(`GovixTV getStream Error: ${error}`);
    return [];
  }
};
