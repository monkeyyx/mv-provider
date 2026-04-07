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

    // Step 1: GET to establish session and capture cookies
    const getRes = await axios.get(fullUrl, {
      headers: {
        ...commonHeaders,
        Referer: baseUrl,
        "X-Requested-With": "XMLHttpRequest",
      },
      signal,
    });

    const setCookie = getRes.headers["set-cookie"];
    let sessionCookie = setCookie ? (Array.isArray(setCookie) ? setCookie.join("; ") : setCookie) : "PHPSESSID=avenj1v3q1663ml31gs796qq45";

    // Step 2: POST to bypass phone verification using 123456789
    const postData = `phone=123456789&full_number=252123456789${mediaId ? `&id=${mediaId}` : ""}`;

    const res = await axios.post(fullUrl, postData, {
      headers: {
        ...commonHeaders,
        "Content-Type": "application/x-www-form-urlencoded",
        Referer: fullUrl,
        Origin: baseUrl,
        "X-Requested-With": "XMLHttpRequest",
        Cookie: sessionCookie,
      },
      signal,
    });

    const html = res.data;

    const finalSetCookie = res.headers["set-cookie"];
    if (finalSetCookie) {
      sessionCookie = Array.isArray(finalSetCookie) ? finalSetCookie.join("; ") : finalSetCookie;
    }

    // Extraction Logic: Look for .m3u8 links
    const m3u8Regex =
      /"(https?:\/\/[^"]+\.m3u8[^"]*)"|'(https?:\/\/[^']+\.m3u8[^']*)'|(?<=file\s*:\s*)(https?:\/\/[^\s,}]+\.m3u8[^\s,}]*)/gi;
    let match;
    const foundUrls = new Set<string>();

    const mobileUA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";

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
