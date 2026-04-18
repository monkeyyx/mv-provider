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
      // Requirements: exactly 8 digits, not starting with '61'
      const digits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

      const getNumber = () => {
        let res = '';
        for (let i = 0; i < 8; i++) {
          res += digits[Math.floor(Math.random() * 10)];
        }
        return res;
      };

      let number = getNumber();
      while (number.startsWith('61')) {
        number = getNumber();
      }
      return number;
    };

    const randomPhone = generateRandomPhone();
    const desktopUA =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
    
    const chromeClientHints = {
      "sec-ch-ua": '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
    };

    const desktopHeaders = {
      ...commonHeaders,
      "User-Agent": desktopUA,
      ...chromeClientHints,
    };

    // Helper to get headers case-insensitively
    const getHeader = (headers: any, name: string) => {
      const lowerName = name.toLowerCase();
      const key = Object.keys(headers).find(k => k.toLowerCase() === lowerName);
      return key ? headers[key] : undefined;
    };

    // Step 1: GET to establish session and capture initial cookies
    const getRes = await axios.get(fullUrl, {
      headers: {
        ...desktopHeaders,
        Referer: baseUrl,
        "X-Requested-With": "XMLHttpRequest",
        Cookie: "", // Start fresh
      },
      signal,
    });

    // Capture cookies from GET
    const initialCookiesRaw = getHeader(getRes.headers, 'set-cookie');
    const initialCookies: string[] = Array.isArray(initialCookiesRaw) 
      ? initialCookiesRaw 
      : (initialCookiesRaw ? [initialCookiesRaw] : []);
    
    const cookieString = initialCookies.map(c => c.split(';')[0]).join('; ');

    // Step 2: POST to bypass phone verification using random 8 digits
    const postData = `phone=${randomPhone}&full_number=252${randomPhone}${mediaId ? `&id=${mediaId}` : ""}`;

    const res = await axios.post(fullUrl, postData, {
      headers: {
        ...desktopHeaders,
        "Content-Type": "application/x-www-form-urlencoded",
        Referer: fullUrl,
        Origin: baseUrl,
        "X-Requested-With": "XMLHttpRequest",
        Cookie: cookieString, // Send the cookies we just got
      },
      signal,
    });

    // Capture updated cookies from POST
    const postCookiesRaw = getHeader(res.headers, 'set-cookie');
    const postCookies: string[] = Array.isArray(postCookiesRaw) 
      ? postCookiesRaw 
      : (postCookiesRaw ? [postCookiesRaw] : []);

    const finalCookieString = [
        ...initialCookies,
        ...postCookies
    ].map(c => c.split(';')[0]).reduce((acc, curr) => {
        const [name] = curr.split('=');
        if (name && !acc.find(item => item.startsWith(`${name}=`))) {
            acc.push(curr);
        }
        return acc;
    }, [] as string[]).join('; ');

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

        // Clean headers for the player to avoid bot detection
        streams.push({
          server: "Govix-HLS",
          link: rawUrl,
          type: "hls",
          headers: {
            "User-Agent": desktopUA,
            Referer: fullUrl,
            Origin: "https://www.govixtv.com",
            Cookie: finalCookieString,
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
