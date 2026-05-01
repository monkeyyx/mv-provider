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
  const url = `https://krmzitv.app/wp-json/api-3chk/v1/${filter}?page=${page}`;
  
  try {
    const response = await axios.get(url, { signal });
    // The paginated response is usually { total_items, total_pages, current_page, data: [...] }
    const items = Array.isArray(response.data) ? response.data : (response.data.data || []);
    
    return items.map((item: any) => ({
      title: item.title,
      link: item.id.toString(), // Pass ID as link
      image: item.poster || "",
      provider: providerValue,
    }));
  } catch (error) {
    console.error(`turkmood getPosts error: ${error}`);
    return [];
  }
};

export const getSearchPosts = async ({
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
}): Promise<Post[]> => {
  // A search endpoint was not identified in the initial analysis, returning empty
  return [];
};
