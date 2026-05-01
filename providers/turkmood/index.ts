import { ProviderType } from "../types";
import { catalog, genres } from "./catalog";
import { getPosts, getSearchPosts } from "./posts";
import { getMeta } from "./meta";
import { getStream } from "./stream";
import { getEpisodeLinks } from "./episodes";

export const turkmood: ProviderType = {
  catalog,
  genres,
  GetHomePosts: getPosts,
  GetSearchPosts: getSearchPosts,
  GetMetaData: getMeta,
  GetEpisodeLinks: getEpisodeLinks,
  GetStream: getStream,
};
