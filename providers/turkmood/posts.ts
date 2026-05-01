import { Post, ProviderContext } from "../types";

export const getPosts = async ({
  filter,
  page,
  providerValue,
  signal,
  providerContext,
}: {
  filter: string;
  page: number;
  providerValue: string;
  signal: AbortSignal;
  providerContext: ProviderContext;
}): Promise<Post[]> => {
  const { axios } = providerContext;

  // Example filter: "movies", "series"
  const connector = filter.includes("?") ? "&" : "?";
  const url = `https://krmzitv.app/wp-json/api-3chk/v1/${filter}${connector}page=${page}`;

  try {
    const response = await axios.get(url, { signal });
    // The paginated response is usually { total_items, total_pages, current_page, data: [...] }
    const items = Array.isArray(response.data)
      ? response.data
      : response.data.data || [];

    return items.map((item: any) => ({
      title: item.title,
      link: item.id.toString(), // Pass ID as link
      image: item.poster || "",
      banner: item.poster || "", // Used for Hero section
      background: item.poster || "", // Fallback for some player themes
      provider: providerValue,
    }));
  } catch (error) {
    console.error(`turkmood getPosts error: ${error}`);
    return [];
  }
};

export const getSearchPosts = async ({
  _searchQuery,
  _page,
  _providerValue,
  _signal,
  _providerContext,
}: {
  _searchQuery: string;
  _page: number;
  _providerValue: string;
  _signal: AbortSignal;
  _providerContext: ProviderContext;
}): Promise<Post[]> => {
  // A search endpoint was not identified in the initial analysis, returning empty
  return [];
};
