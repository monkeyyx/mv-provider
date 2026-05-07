import { Post, ProviderContext } from "../types";
import { genres } from "./catalog";

const DEFAULT_IMAGE =
  "https://placehold.jp/24/363636/ffffff/500x750.png?text=Fanbroj";
const ABSOLUTE_URL_PATTERN = /^https?:\/\//i;

const toAbsoluteUrl = (value: string | undefined, baseUrl: string): string => {
  if (!value) return "";
  if (ABSOLUTE_URL_PATTERN.test(value)) return value;
  return `${baseUrl}${value.startsWith("/") ? "" : "/"}${value}`;
};

const GENRE_MAP: Record<string, number> = {
  Action: 2,
  Adventure: 3,
  Animation: 4,
  Comedy: 5,
  Crime: 6,
  Documentary: 1083,
  Drama: 7,
  Family: 2302,
  Fantasy: 1088,
  History: 8,
  Horror: 9,
  Music: 1085,
  Mystery: 10,
  Romance: 11,
  "Science Fiction": 12,
  "Sci-Fi": 12,
  Thriller: 13,
  War: 14,
  Western: 3968,
};

const decodeHtml = (html: string) => {
  return html.replace(/&#([0-9]+);/g, (_, dec) => String.fromCharCode(dec))
             .replace(/&amp;/g, '&')
             .replace(/&quot;/g, '"')
             .replace(/&apos;/g, "'")
             .replace(/&lt;/g, '<')
             .replace(/&gt;/g, '>');
};

export const getPosts = async function ({
  filter,
  searchQuery,
  page,
  providerValue,
  signal,
  providerContext,
}: {
  filter?: string;
  searchQuery?: string;
  page: number;
  providerValue: string;
  signal: AbortSignal;
  providerContext: ProviderContext;
}): Promise<Post[]> {
  if (searchQuery) {
    return getSearchPosts({
      searchQuery,
      page,
      providerValue,
      signal,
      providerContext,
    });
  }

  const { axios, commonHeaders } = providerContext;
  const baseUrl = "https://fanprojnet.com";
  const apiBase = `${baseUrl}/wp-json/wp/v2`;

  const isSeries = filter === "/tv-shows";
  const isGenre = filter?.startsWith("genre:");
  const isTag = filter?.startsWith("tag:");

  let apiUrl = "";
  if (isSeries) {
    apiUrl = `${apiBase}/tv?page=${page}&per_page=20&_embed`;
  } else {
    apiUrl = `${apiBase}/posts?page=${page}&per_page=20&_embed`;
    if (isGenre) {
      const genreName = filter!.replace("genre:", "");
      const genreId = GENRE_MAP[genreName];
      if (genreId) {
        apiUrl += `&categories=${genreId}`;
      } else {
        apiUrl += `&search=${encodeURIComponent(genreName)}`;
      }
    } else if (isTag) {
      const tagName = filter!.replace("tag:", "");
      if (tagName.toLowerCase() === "afsomali") {
        apiUrl += `&categories=1076`; // Musalsal af somali category
      } else {
        apiUrl += `&search=${encodeURIComponent(tagName)}`;
      }
    }
  }

  try {
    const res = await axios.get(apiUrl, {
      headers: {
        ...commonHeaders,
        Referer: baseUrl,
      },
      signal,
    });

    const items = res.data;
    if (!Array.isArray(items)) return [];

    return items.map((item: any) => {
      const posterUrl =
        item._embedded?.["wp:featuredmedia"]?.[0]?.source_url ||
        item.jetpack_featured_media_url ||
        DEFAULT_IMAGE;

      return {
        title: decodeHtml(item.title.rendered),
        image: posterUrl,
        link: item.link,
        provider: providerValue,
      };
    });
  } catch (error) {
    console.error(`FanprojNet getPosts Error: ${error}`);
    return [];
  }
};

export const getSearchPosts = async function ({
  searchQuery,
  page,
  providerValue,
  signal,
  providerContext,
}: {
  searchQuery: string;
  page: number;
  providerValue: string;
  signal: AbortSignal;
  providerContext: ProviderContext;
}): Promise<Post[]> {
  const { axios, commonHeaders } = providerContext;
  const baseUrl = "https://fanprojnet.com";
  const apiBase = `${baseUrl}/wp-json/wp/v2`;

  const searchResults: Post[] = [];
  const processedLinks = new Set<string>();

  try {
    // Search both movies (posts) and tv (series) in parallel for efficiency
    const movieUrl = `${apiBase}/posts?search=${encodeURIComponent(searchQuery)}&page=${page}&per_page=15&_embed`;
    const tvUrl = `${apiBase}/tv?search=${encodeURIComponent(searchQuery)}&page=${page}&per_page=15&_embed`;

    const results = await Promise.allSettled([
      axios.get(movieUrl, { headers: { ...commonHeaders, Referer: baseUrl }, signal }),
      axios.get(tvUrl, { headers: { ...commonHeaders, Referer: baseUrl }, signal })
    ]);

    results.forEach((result) => {
      if (result.status === "fulfilled" && Array.isArray(result.value.data)) {
        result.value.data.forEach((item: any) => {
          const link = item.link;
          if (!processedLinks.has(link)) {
            const posterUrl =
              item._embedded?.["wp:featuredmedia"]?.[0]?.source_url ||
              item.jetpack_featured_media_url ||
              DEFAULT_IMAGE;

            searchResults.push({
              title: decodeHtml(item.title.rendered),
              image: posterUrl,
              link,
              provider: providerValue,
            });
            processedLinks.add(link);
          }
        });
      }
    });

    return searchResults;
  } catch (error) {
    console.error(`FanprojNet getSearchPosts Error: ${error}`);
    return [];
  }
};
