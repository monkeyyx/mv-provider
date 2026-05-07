import { EpisodeLink, ProviderContext } from "../types";

export const getEpisodes = async function ({
  url,
  providerContext,
}: {
  url: string;
  providerContext: ProviderContext;
}): Promise<EpisodeLink[]> {
  console.log(`[FanprojNet] Fetching Episodes for: ${url}`);
  const { axios, commonHeaders } = providerContext;
  const baseUrl = "https://fanprojnet.com";

  try {
    const res = await axios.get(url, {
      headers: {
        ...commonHeaders,
        Referer: baseUrl,
      },
    });

    const html = res.data;
    if (!html) return [];

    const episodes: EpisodeLink[] = [];
    
    // Look for links like: https://fanprojnet.com/eps/esref-ruya-af-somali-season-1-episode-1/
    // They are usually inside a <div class="gmr-listseries"> or similar
    const linkRegex = /href="(https:\/\/fanprojnet\.com\/eps\/[^"]+)"[^>]*>([^<]+)<\/a>/g;
    let match;
    
    while ((match = linkRegex.exec(html)) !== null) {
      const epUrl = match[1];
      const epTitle = match[2].trim();
      
      // Avoid duplicate links
      if (!episodes.find(e => e.link === epUrl)) {
        episodes.push({
          title: epTitle,
          link: epUrl,
        });
      }
    }

    // If no links found with the regex, try a more generic one
    if (episodes.length === 0) {
       const genericRegex = /https:\/\/fanprojnet\.com\/eps\/[a-zA-Z0-9-]+\//g;
       const matches = html.match(genericRegex);
       if (matches) {
         matches.forEach((m: string, index: number) => {
           if (!episodes.find(e => e.link === m)) {
             episodes.push({
               title: `Episode ${index + 1}`,
               link: m,
             });
           }
         });
       }
    }

    // Re-order if needed (they are usually in order but sometimes reversed)
    return episodes;
  } catch (error) {
    console.error(`FanprojNet getEpisodeLinks Error: ${error}`);
    return [];
  }
};

// Backward compatibility
export const getEpisodeLinks = getEpisodes;
