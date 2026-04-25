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
  const { axios, getBaseUrl } = providerContext;
  const baseUrl = (await getBaseUrl("govixtv")) || "https://www.govixtv.com";

  // Case 0: Structured Proxy link (contains direct M3U8 for movies)
  if (link.startsWith("proxy_id::")) {
    const [_, type, id, title, image, stream] = link.split("::");
    if (type === "movie" && stream && stream.includes(".m3u8")) {
      return [
        {
          server: "Govix-Cloud",
          link: stream,
          type: "hls",
          headers: {
            "User-Agent": "SoodagLives/1.1",
            ppkey: "Hg4fPewbcGfBTskQQE5mktC2vgEHT9GX",
            Referer: "https://www.govixtv.com/",
          },
          quality: "1080",
        },
      ];
    }
    // Fallback: If it's something else but has proxy_id, try to use the ID in Case 2
    link = link.split("::")[2] || link;
  }

  // Case 1: Direct M3U8 link from Proxy API
  if (link.includes(".m3u8")) {
    return [
      {
        server: "Govix-Direct",
        link: link,
        type: "hls",
        headers: {
          "User-Agent": "SoodagLives/1.1",
          ppkey: "Hg4fPewbcGfBTskQQE5mktC2vgEHT9GX",
          Referer: "https://www.govixtv.com/",
        },
        quality: "1080",
      },
    ];
  }

  // Case 2: Standard GovixTV link - apply the ppkey and phone bypass
  const fullUrl = link.startsWith("http")
    ? link
    : `${baseUrl}${link.startsWith("/") ? "" : "/"}${link}`;
  const streams: Stream[] = [];

  try {
    const idMatch = fullUrl.match(/id=(\d+)/);
    const mediaId = idMatch ? idMatch[1] : "";

    const generateRandomPhone = () => {
      const digits = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
      const getNumber = () => {
        let res = "";
        for (let i = 0; i < 8; i++)
          res += digits[Math.floor(Math.random() * 10)];
        return res;
      };
      let number = getNumber();
      while (number.startsWith("61")) number = getNumber();
      return number;
    };

    const randomPhone = generateRandomPhone();
    const headers = {
      "User-Agent": "SoodagLives/1.1",
      ppkey: "Hg4fPewbcGfBTskQQE5mktC2vgEHT9GX", // Authenticate as Suu Player
      "X-Requested-With": "com.soodag.lives",
    };

    if (mediaId) {
      try {
        const { data } = await axios.get(
          `https://orangegas.store/aaa.php?uid=${mediaId}`,
          {
            headers,
            signal,
            timeout: 5000,
          },
        );
        if (data && data.signedUrl) {
          return [
            {
              server: "Govix-Cloud",
              link: data.signedUrl,
              type: "hls",
              headers: { "User-Agent": "SoodagLives/1.1" },
              quality: "1080",
            },
          ];
        }
      } catch (e) {
        try {
          const { data } = await axios.get(
            `https://www.govixtv.com/aaa.php?uid=${mediaId}`,
            {
              headers,
              signal,
              timeout: 5000,
            },
          );
          if (data && data.signedUrl) {
            return [
              {
                server: "Govix-Cloud",
                link: data.signedUrl,
                type: "hls",
                headers: { "User-Agent": "SoodagLives/1.1" },
                quality: "1080",
              },
            ];
          }
        } catch (e2: any) {
          console.error("GovixTV aaa.php bypass failed", e2.message);
        }
      }
    }

    // Step 1: GET to establish session
    const getRes = await axios.get(fullUrl, {
      headers: { ...headers, Referer: baseUrl, Cookie: "" },
      signal,
    });

    const setCookie = getRes.headers["set-cookie"];
    const cookie = Array.isArray(setCookie)
      ? setCookie.map((c) => c.split(";")[0]).join("; ")
      : "";

    // Step 2: POST to bypass phone verification
    const postData = `phone=${randomPhone}&full_number=252${randomPhone}${mediaId ? `&id=${mediaId}` : ""}`;
    const res = await axios.post(fullUrl, postData, {
      headers: {
        ...headers,
        "Content-Type": "application/x-www-form-urlencoded",
        Referer: fullUrl,
        Origin: baseUrl,
        Cookie: cookie,
      },
      signal,
    });

    const html = res.data;
    const m3u8Regex = /"(https?:\/\/[^"]+\.m3u8[^"]*)"/gi;
    let match;
    const foundUrls = new Set<string>();

    while ((match = m3u8Regex.exec(html)) !== null) {
      const rawUrl = match[1];
      if (rawUrl && !foundUrls.has(rawUrl)) {
        foundUrls.add(rawUrl);
        streams.push({
          server: "Govix-Verified",
          link: rawUrl,
          type: "hls",
          headers: {
            "User-Agent": "SoodagLives/1.1",
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
