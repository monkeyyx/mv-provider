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

    const generateRandomPhone = () => {
      let firstDigit;
      do {
        firstDigit = Math.floor(Math.random() * 9) + 1; // 1-9
      } while (firstDigit === 6); // Avoid starting with 6 (matches '61' avoid requirement loosely)

      const length = Math.floor(Math.random() * 3) + 6; // 6 to 8 digits
      let number = firstDigit.toString();
      for (let i = 1; i < length; i++) {
        number += Math.floor(Math.random() * 10).toString();
      }
      return number;
    };

    const randomPhone = generateRandomPhone();
    const desktopUA =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
    const desktopHeaders = {
      ...commonHeaders,
      "User-Agent": desktopUA,
      "sec-ch-ua":
        '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
    };

    // Step 1: GET to establish session (cookies are now ignored to avoid restrictions)
    const getRes = await axios.get(fullUrl, {
      headers: {
        ...desktopHeaders,
        Referer: baseUrl,
        "X-Requested-With": "XMLHttpRequest",
        Cookie: "", // Strictly no cookies for incognito behavior
      },
      signal,
    });

    // Step 2: POST to bypass phone verification using random 6-8 digits
    const postData = `phone=${randomPhone}&full_number=252${randomPhone}${mediaId ? `&id=${mediaId}` : ""}`;

    const res = await axios.post(fullUrl, postData, {
      headers: {
        ...desktopHeaders,
        "Content-Type": "application/x-www-form-urlencoded",
        Referer: fullUrl,
        Origin: baseUrl,
        "X-Requested-With": "XMLHttpRequest",
        Cookie: "", // Strictly no cookies
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

        // Clean the URL: strip sig and debug_ip
        const cleanUrl = rawUrl.split("?")[0];

        streams.push({
          server: "Govix-HLS",
          link: cleanUrl,
          type: "hls",
          headers: {
            Cookie: "",
            Referer: "https://www.govixtv.com/",
            Origin: "https://www.govixtv.com",
            "User-Agent": desktopUA,
          },
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
