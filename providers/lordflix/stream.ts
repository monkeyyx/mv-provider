import { Stream, ProviderContext, TextTracks } from "../types";

export const getStream = async ({
  link: id,
  type,
  providerContext,
}: {
  link: string;
  type: string;
  providerContext: ProviderContext;
}): Promise<Stream[]> => {
  try {
    const streams: Stream[] = [];
    const payload = (() => {
      try {
        return JSON.parse(id);
      } catch {
        return { tmdbId: id };
      }
    })();

    const tmdbId: string | number =
      payload.tmdbId ?? payload.id ?? payload.tmdId ?? "";
    const imdbId: string = payload.imdbId ?? "";
    const season: string = payload.season ?? "";
    const episode: string = payload.episode ?? "";
    const effectiveType: string = payload.type ?? type ?? "movie";

    // Fetch from multiple sources in parallel
    await Promise.allSettled([
      getVidsrcStream(
        String(tmdbId),
        imdbId,
        episode,
        season,
        effectiveType,
        streams,
        providerContext,
      ),
      getAutoembedStream(
        String(tmdbId),
        episode,
        season,
        effectiveType,
        streams,
        providerContext,
      ),
      getRiveStream(
        String(tmdbId),
        episode,
        season,
        effectiveType,
        streams,
        providerContext,
      ),
    ]);

    return streams;
  } catch (err) {
    console.error("lordflix getStream error", err);
    return [];
  }
};

////////// Vidsrc.to
async function getVidsrcStream(
  tmdbId: string,
  imdbId: string,
  episode: string,
  season: string,
  type: string,
  Streams: Stream[],
  providerContext: ProviderContext,
) {
  if (!tmdbId || tmdbId === "undefined") return;
  try {
    const baseUrl = "https://vidsrc.to";
    const embedUrl =
      type === "series"
        ? `${baseUrl}/embed/tv/${tmdbId}/${season}/${episode}`
        : `${baseUrl}/embed/movie/${tmdbId}`;

    console.log("lordflix vidsrc url:", embedUrl);
    const res = await providerContext.axios.get(embedUrl, {
      timeout: 15000,
      headers: {
        ...providerContext.commonHeaders,
        Referer: "https://lordflix.org/",
      },
    });

    const $ = providerContext.cheerio.load(res.data);
    // Find server list items
    const servers: { name: string; dataHash: string }[] = [];
    $("[data-hash]").each((_: any, el: any) => {
      const hash = $(el).attr("data-hash") || "";
      const name = $(el).text().trim() || "Vidsrc";
      if (hash) {
        servers.push({ name, dataHash: hash });
      }
    });

    for (const server of servers) {
      try {
        const sourceUrl = `${baseUrl}/ajax/embed/episode/${server.dataHash}/sources`;
        const sourceRes = await providerContext.axios.get(sourceUrl, {
          timeout: 10000,
          headers: {
            ...providerContext.commonHeaders,
            Referer: embedUrl,
            "X-Requested-With": "XMLHttpRequest",
          },
        });
        const sourceData = sourceRes.data;
        if (sourceData?.result?.url) {
          Streams.push({
            server: `LordFlix-${server.name}`,
            link: sourceData.result.url,
            type: "m3u8",
            headers: {
              Referer: baseUrl,
            },
          });
        }
      } catch (e) {
        console.log("lordflix vidsrc server error:", server.name, e);
      }
    }
  } catch (e) {
    console.log("lordflix vidsrc error:", e);
  }
}

////////// Autoembed.co
async function getAutoembedStream(
  tmdbId: string,
  episode: string,
  season: string,
  type: string,
  Streams: Stream[],
  providerContext: ProviderContext,
) {
  if (!tmdbId || tmdbId === "undefined") return;
  try {
    const embedUrl =
      type === "series"
        ? `https://autoembed.co/tv/tmdb/${tmdbId}-${season}-${episode}`
        : `https://autoembed.co/movie/tmdb/${tmdbId}`;

    console.log("lordflix autoembed url:", embedUrl);
    const res = await providerContext.axios.get(embedUrl, {
      timeout: 15000,
      headers: {
        ...providerContext.commonHeaders,
        Referer: "https://lordflix.org/",
      },
    });

    const $ = providerContext.cheerio.load(res.data);
    // Look for iframe sources
    const iframes: string[] = [];
    $("iframe").each((_: any, el: any) => {
      const src = $(el).attr("src");
      if (src) iframes.push(src);
    });

    // Look for server links
    $("li[data-id], a[data-id]").each((_: any, el: any) => {
      const id = $(el).attr("data-id") || "";
      const name = $(el).text().trim() || "AutoEmbed";
      if (id) {
        Streams.push({
          server: `LordFlix-AE-${name}`,
          link: id.startsWith("http") ? id : `https://autoembed.co${id}`,
          type: "m3u8",
          headers: {
            Referer: "https://autoembed.co/",
          },
        });
      }
    });

    for (const iframe of iframes) {
      Streams.push({
        server: "LordFlix-AutoEmbed",
        link: iframe.startsWith("http") ? iframe : `https:${iframe}`,
        type: "m3u8",
        headers: {
          Referer: "https://autoembed.co/",
        },
      });
    }
  } catch (e) {
    console.log("lordflix autoembed error:", e);
  }
}

////////// Rive stream (same backend LordFlix uses)
async function getRiveStream(
  tmdId: string,
  episode: string,
  season: string,
  type: string,
  Streams: Stream[],
  providerContext: ProviderContext,
) {
  if (!tmdId || tmdId === "undefined") {
    console.warn("lordflix/rive: missing tmdbId");
    return;
  }
  const secret = generateSecretKey(tmdId);
  const servers = [
    "nirvana",
    "panda",
    "cherry",
    "lordflix",
    "flowcast",
    "shadow",
    "primevids",
    "aqua",
  ];
  const baseUrl = await providerContext.getBaseUrl("rive");
  if (!baseUrl) {
    console.warn("lordflix/rive: no baseUrl found");
    return;
  }
  const cors = process.env.CORS_PRXY ? process.env.CORS_PRXY + "?url=" : "";
  const route =
    type === "series"
      ? `/api/backendfetch?requestID=tvVideoProvider&id=${tmdId}&season=${season}&episode=${episode}&secretKey=${secret}&service=`
      : `/api/backendfetch?requestID=movieVideoProvider&id=${tmdId}&secretKey=${secret}&service=`;
  const url = cors
    ? cors + encodeURIComponent(baseUrl + route)
    : baseUrl + route;

  await Promise.allSettled(
    servers.map(async (server) => {
      console.log("lordflix rive:", url + server);
      try {
        const res = await providerContext.axios.get(url + server, {
          timeout: 8000,
        });
        const subtitles: TextTracks = [];
        if (res.data?.data?.captions) {
          res.data?.data?.captions.forEach((sub: any) => {
            subtitles.push({
              language: sub?.label?.slice(0, 2) || "Und",
              uri: sub?.file,
              title: sub?.label || "Undefined",
              type: sub?.file?.endsWith(".vtt")
                ? "text/vtt"
                : "application/x-subrip",
            });
          });
        }
        res.data?.data?.sources?.forEach((source: any) => {
          Streams.push({
            server: `LordFlix-${server}-${source?.quality || "auto"}`,
            link: source?.url,
            type: source?.format === "hls" ? "m3u8" : "mp4",
            quality: source?.quality,
            subtitles: subtitles.length > 0 ? subtitles : undefined,
            headers: {
              referer: baseUrl,
            },
          });
        });
      } catch (e) {
        console.log(`lordflix rive ${server} error:`, e);
      }
    }),
  );
}

function generateSecretKey(id: number | string) {
  const c = [
    "4Z7lUo",
    "gwIVSMD",
    "PLmz2elE2v",
    "Z4OFV0",
    "SZ6RZq6Zc",
    "zhJEFYxrz8",
    "FOm7b0",
    "axHS3q4KDq",
    "o9zuXQ",
    "4Aebt",
    "wgjjWwKKx",
    "rY4VIxqSN",
    "kfjbnSo",
    "2DyrFA1M",
    "YUixDM9B",
    "JQvgEj0",
    "mcuFx6JIek",
    "eoTKe26gL",
    "qaI9EVO1rB",
    "0xl33btZL",
    "1fszuAU",
    "a7jnHzst6P",
    "wQuJkX",
    "cBNhTJlEOf",
    "KNcFWhDvgT",
    "XipDGjST",
    "PCZJlbHoyt",
    "2AYnMZkqd",
    "HIpJh",
    "KH0C3iztrG",
    "W81hjts92",
    "rJhAT",
    "NON7LKoMQ",
    "NMdY3nsKzI",
    "t4En5v",
    "Qq5cOQ9H",
    "Y9nwrp",
    "VX5FYVfsf",
    "cE5SJG",
    "x1vj1",
    "HegbLe",
    "zJ3nmt4OA",
    "gt7rxW57dq",
    "clIE9b",
    "jyJ9g",
    "B5jXjMCSx",
    "cOzZBZTV",
    "FTXGy",
    "Dfh1q1",
    "ny9jqZ2POI",
    "X2NnMn",
    "MBtoyD",
    "qz4Ilys7wB",
    "68lbOMye",
    "3YUJnmxp",
    "1fv5Imona",
    "PlfvvXD7mA",
    "ZarKfHCaPR",
    "owORnX",
    "dQP1YU",
    "dVdkx",
    "qgiK0E",
    "cx9wQ",
    "5F9bGa",
    "7UjkKrp",
    "Yvhrj",
    "wYXez5Dg3",
    "pG4GMU",
    "MwMAu",
    "rFRD5wlM",
  ];

  if (id === undefined) {
    return "rive";
  }

  try {
    let t: string, n: number;
    const r = String(id);

    if (isNaN(Number(id))) {
      const sum = r.split("").reduce((e, ch) => e + ch.charCodeAt(0), 0);
      t = c[sum % c.length] || btoa(r);
      n = Math.floor((sum % r.length) / 2);
    } else {
      const num = Number(id);
      t = c[num % c.length] || btoa(r);
      n = Math.floor((num % r.length) / 2);
    }

    const i = r.slice(0, n) + t + r.slice(n);

    /* eslint-disable no-bitwise */
    const innerHash = (e: string) => {
      e = String(e);
      let t = 0 >>> 0;
      for (let n = 0; n < e.length; n++) {
        const r = e.charCodeAt(n);
        const i =
          (((t = (r + (t << 6) + (t << 16) - t) >>> 0) << n % 5) |
            (t >>> (32 - (n % 5)))) >>>
          0;
        t = (t ^ (i ^ (((r << n % 7) | (r >>> (8 - (n % 7)))) >>> 0))) >>> 0;
        t = (t + ((t >>> 11) ^ (t << 3))) >>> 0;
      }
      t ^= t >>> 15;
      t = ((t & 65535) * 49842 + ((((t >>> 16) * 49842) & 65535) << 16)) >>> 0;
      t ^= t >>> 13;
      t = ((t & 65535) * 40503 + ((((t >>> 16) * 40503) & 65535) << 16)) >>> 0;
      t ^= t >>> 16;
      return t.toString(16).padStart(8, "0");
    };

    const outerHash = (e: string) => {
      const t = String(e);
      let n = (3735928559 ^ t.length) >>> 0;
      for (let idx = 0; idx < t.length; idx++) {
        let r = t.charCodeAt(idx);
        r ^= ((131 * idx + 89) ^ (r << idx % 5)) & 255;
        n = (((n << 7) | (n >>> 25)) >>> 0) ^ r;
        const i = ((n & 65535) * 60205) >>> 0;
        const o = (((n >>> 16) * 60205) << 16) >>> 0;
        n = (i + o) >>> 0;
        n ^= n >>> 11;
      }
      n ^= n >>> 15;
      n = (((n & 65535) * 49842 + (((n >>> 16) * 49842) << 16)) >>> 0) >>> 0;
      n ^= n >>> 13;
      n = (((n & 65535) * 40503 + (((n >>> 16) * 40503) << 16)) >>> 0) >>> 0;
      n ^= n >>> 16;
      n = (((n & 65535) * 10196 + (((n >>> 16) * 10196) << 16)) >>> 0) >>> 0;
      n ^= n >>> 15;
      return n.toString(16).padStart(8, "0");
    };
    /* eslint-enable no-bitwise */

    const o = outerHash(innerHash(i));
    return btoa(o);
  } catch (e) {
    return "topSecret";
  }
}
