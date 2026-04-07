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

    // Extract session cookie if any, otherwise use fallback
    const setCookie = getRes.headers["set-cookie"];
    let sessionCookie = setCookie ? (Array.isArray(setCookie) ? setCookie.join("; ") : setCookie) : "PHPSESSID=avenj1v3q1663ml31gs796qq45";

    // Step 2: POST to bypass phone verification
    const postData = `phone=615123456&full_number=252615123456${mediaId ? `&id=${mediaId}` : ""}`;

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

    // Capture updated session if any
    const finalSetCookie = res.headers["set-cookie"];
    if (finalSetCookie) {
      sessionCookie = Array.isArray(finalSetCookie) ? finalSetCookie.join("; ") : finalSetCookie;
    }

    // Extraction Logic: Look for .m3u8 links
    const m3u8Regex =
      /"(https?:\/\/[^"]+\.m3u8[^"]*)"|'(https?:\/\/[^']+\.m3u8[^']*)'|(?<=file\s*:\s*)(https?:\/\/[^\s,}]+\.m3u8[^\s,}]*)/gi;
    let match;
    const foundUrls = new Set<string>();

    const mobileUA = "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36";

    while ((match = m3u8Regex.exec(html)) !== null) {
      const rawUrl = match[1] || match[2] || match[3];
      if (rawUrl && !foundUrls.has(rawUrl)) {
        foundUrls.add(rawUrl);

        streams.push({
          server: 'Govix-HLS',
          link: rawUrl, // Keeping query parameters as they might contain tokens
          type: 'hls',
          headers: {
            Cookie: sessionCookie,
            Referer: baseUrl,
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
