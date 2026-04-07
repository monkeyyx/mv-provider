import { Post, ProviderContext } from "../types";
import { genres } from "./catalog";

const DEFAULT_IMAGE = "https://placehold.jp/24/363636/ffffff/500x750.png?text=Fanbroj";
const ABSOLUTE_URL_PATTERN = /^https?:\/\//i;

const toAbsoluteUrl = (value: string | undefined, baseUrl: string): string => {
  if (!value) return "";
  if (ABSOLUTE_URL_PATTERN.test(value)) return value;
  return `${baseUrl}${value.startsWith("/") ? "" : "/"}${value}`;
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

  if (!filter) return [];

  const { axios, commonHeaders } = providerContext;
  const baseUrl = "https://fanbroj.net";

  // The API endpoint differs for movies and series
  const isSeries = filter === "/tv-shows";
  const isGenre = filter.startsWith("genre:");
  const isTag = filter.startsWith("tag:");

  let apiUrl = "";
  if (isGenre) {
    const genreName = filter.replace("genre:", "");
    apiUrl = `${baseUrl}/api/movies?page=${page}&genres=${genreName}`;
  } else if (isTag) {
    const tagName = filter.replace("tag:", "");
    apiUrl = `${baseUrl}/api/movies?page=${page}&tags=${tagName}`;
  } else {
    apiUrl = isSeries
      ? `${baseUrl}/api/series?page=${page}`
      : `${baseUrl}/api/movies?page=${page}`;
  }

  try {
    const res = await axios.get(apiUrl, {
      headers: {
        ...commonHeaders,
        Referer: baseUrl,
        "X-Requested-With": "XMLHttpRequest",
      },
      signal,
    });

    const data = res.data;
    if (!data) return [];

    // Movies API returns { movies: [...] }, Series API returns [...]
    const items = isSeries ? data : (data.movies || []);

    return items.map((item: any) => ({
      title: item.title,
      image:
        toAbsoluteUrl(item.posterUrl, baseUrl) ||
        toAbsoluteUrl(item.backdropUrl, baseUrl) ||
        DEFAULT_IMAGE,
      link: toAbsoluteUrl(
        isSeries ? `/series/${item.slug}` : `/movies/${item.slug}`,
        baseUrl,
      ),
      provider: providerValue,
    }));
  } catch (error) {
    console.error(`Fanbroj getPosts Error: ${error}`);
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
  const baseUrl = "https://fanbroj.net";

  // Check if query matches a genre name
  const matchedGenre = genres.find(
    (g) => g.title.toLowerCase() === searchQuery.toLowerCase(),
  );

  const searchResults: Post[] = [];
  const processedLinks = new Set<string>();

  try {
    // 1. Fetch results from the standard search API
    const apiUrl = `${baseUrl}/api/search?q=${encodeURIComponent(searchQuery)}&page=${page}`;
    const res = await axios.get(apiUrl, {
      headers: {
        ...commonHeaders,
        Referer: baseUrl,
        "X-Requested-With": "XMLHttpRequest",
      },
      signal,
    });

    const data = res.data;
    if (data) {
      if (data.movies && Array.isArray(data.movies)) {
        data.movies.forEach((item: any) => {
          const link = toAbsoluteUrl(`/movies/${item.slug}`, baseUrl);
          if (!processedLinks.has(link)) {
            searchResults.push({
              title: item.title,
              image:
                toAbsoluteUrl(item.posterUrl, baseUrl) ||
                toAbsoluteUrl(item.backdropUrl, baseUrl) ||
                DEFAULT_IMAGE,
              link,
              provider: providerValue,
            });
            processedLinks.add(link);
          }
        });
      }

      if (data.series && Array.isArray(data.series)) {
        data.series.forEach((item: any) => {
          const link = toAbsoluteUrl(`/series/${item.slug}`, baseUrl);
          if (!processedLinks.has(link)) {
            searchResults.push({
              title: item.title,
              image:
                toAbsoluteUrl(item.posterUrl, baseUrl) ||
                toAbsoluteUrl(item.backdropUrl, baseUrl) ||
                DEFAULT_IMAGE,
              link,
              provider: providerValue,
            });
            processedLinks.add(link);
          }
        });
      }
    }

    // 2. If it matches a genre, also fetch movies from that genre
    if (matchedGenre && page === 1) {
      const genreName = matchedGenre.filter.replace("genre:", "");
      const genreApiUrl = `${baseUrl}/api/movies?page=1&genres=${genreName}`;
      const genreRes = await axios.get(genreApiUrl, {
        headers: {
          ...commonHeaders,
          Referer: baseUrl,
          "X-Requested-With": "XMLHttpRequest",
        },
        signal,
      });

      const genreData = genreRes.data;
      if (genreData && genreData.movies && Array.isArray(genreData.movies)) {
        genreData.movies.forEach((item: any) => {
          const link = toAbsoluteUrl(`/movies/${item.slug}`, baseUrl);
          if (!processedLinks.has(link)) {
            searchResults.push({
              title: item.title,
              image:
                toAbsoluteUrl(item.posterUrl, baseUrl) ||
                toAbsoluteUrl(item.backdropUrl, baseUrl) ||
                DEFAULT_IMAGE,
              link,
              provider: providerValue,
            });
            processedLinks.add(link);
          }
        });
      }
    }

    return searchResults;
  } catch (error) {
    console.error(`Fanbroj getSearchPosts Error: ${error}`);
    return [];
  }
};

