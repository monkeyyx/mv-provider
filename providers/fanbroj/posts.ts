import { Post, ProviderContext } from "../types";

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
  const isSeries = filter === "/tv-shows" || filter === "/anime" ? true : false;
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
      },
      signal,
    });

    const data = res.data;
    if (!data) return [];

    // Movies API returns { movies: [...] }, Series API returns [...]
    const items = isSeries ? data : (data.movies || []);

    return items.map((item: any) => ({
      title: item.title,
      image: item.posterUrl || item.backdropUrl,
      link: isSeries ? `/series/${item.slug}` : `/movies/${item.slug}`,
      provider: providerValue,
    }));
  } catch (error) {
    console.error(`Fanbroj getPosts Error: ${error}`);
    return [];
  }
};

const getSearchPosts = async function ({
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
  const apiUrl = `${baseUrl}/api/search?q=${encodeURIComponent(searchQuery)}&page=${page}`;

  try {
    const res = await axios.get(apiUrl, {
      headers: {
        ...commonHeaders,
        Referer: baseUrl,
      },
      signal,
    });

    const data = res.data;
    if (!data) return [];

    const searchResults: Post[] = [];

    if (data.movies && Array.isArray(data.movies)) {
      data.movies.forEach((item: any) => {
        searchResults.push({
          title: item.title,
          image: item.posterUrl || item.backdropUrl || "",
          link: `/movies/${item.slug}`,
          provider: providerValue,
        });
      });
    }

    if (data.series && Array.isArray(data.series)) {
      data.series.forEach((item: any) => {
        searchResults.push({
          title: item.title,
          image: item.posterUrl || item.backdropUrl || "",
          link: `/series/${item.slug}`,
          provider: providerValue,
        });
      });
    }

    return searchResults;
  } catch (error) {
    console.error(`Fanbroj getSearchPosts Error: ${error}`);
    return [];
  }
};

