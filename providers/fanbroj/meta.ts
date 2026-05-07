import { Info, ProviderContext } from "../types";

const DEFAULT_IMAGE =
  "https://placehold.jp/24/363636/ffffff/500x750.png?text=Fanbroj";

const decodeHtml = (html: string) => {
  return html.replace(/&#([0-9]+);/g, (_, dec) => String.fromCharCode(dec))
             .replace(/&amp;/g, '&')
             .replace(/&quot;/g, '"')
             .replace(/&apos;/g, "'")
             .replace(/&lt;/g, '<')
             .replace(/&gt;/g, '>');
};

export const getMeta = async function ({
  link,
  provider,
  providerContext,
}: {
  link: string;
  provider: string;
  providerContext: ProviderContext;
}): Promise<Info> {
  console.log(`[FanprojNet] Fetching Meta for: ${link}`);
  const { axios, commonHeaders } = providerContext;
  const baseUrl = "https://fanprojnet.com";
  const apiBase = `${baseUrl}/wp-json/wp/v2`;

  const isSeries = link.includes("/tv/");
  
  const urlParts = link.replace(/\/$/, "").split("/");
  const slug = urlParts.pop() || "";

  let apiUrl = isSeries
    ? `${apiBase}/tv?slug=${slug}&_embed`
    : `${apiBase}/posts?slug=${slug}&_embed`;

  try {
    const res = await axios.get(apiUrl, {
      headers: {
        ...commonHeaders,
        Referer: baseUrl,
      },
    });

    const dataArr = res.data;
    const data = Array.isArray(dataArr) ? dataArr[0] : dataArr;
    if (!data) throw new Error("No data found");

    const posterUrl =
      data._embedded?.["wp:featuredmedia"]?.[0]?.source_url ||
      data.jetpack_featured_media_url ||
      DEFAULT_IMAGE;

    const info: Info = {
      title: decodeHtml(data.title.rendered),
      image: posterUrl,
      synopsis: data.content.rendered.replace(/<[^>]*>?/gm, "").trim(),
      imdbId: data.meta?.muviid || "", 
      type: isSeries ? "series" : "movie",
      rating: data.meta?.muvirating?.toString() || null,
      cast: [],
      linkList: [],
    };

    if (isSeries) {
      info.linkList.push({
        title: "Default",
        episodesLink: link,
      });
    } else {
      const directLinks: { title: string; link: string; type: "movie" }[] = [];
      const meta = data.meta || {};
      
      for (let i = 1; i <= 10; i++) {
        const playerHtml = meta[`IDMUVICORE_Player${i}`];
        if (playerHtml && typeof playerHtml === 'string') {
          const match = playerHtml.match(/src="([^"]+)"/);
          if (match) {
            directLinks.push({
              title: meta[`IDMUVICORE_Title_Player${i}`] || `Server ${i}`,
              link: match[1],
              type: "movie" as const,
            });
          }
        }
      }

      if (directLinks.length > 0) {
        info.linkList.push({
          title: "Default",
          directLinks,
        });
      }
    }

    return info;
  } catch (error) {
    console.error(`FanprojNet getMetaData Error: ${error}`);
    return {
      title: "",
      image: "",
      synopsis: "",
      imdbId: "",
      type: "movie",
      linkList: [],
    };
  }
};

// Backward compatibility
export const getMetaData = getMeta;
