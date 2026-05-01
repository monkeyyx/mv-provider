import { Stream, ProviderContext } from "../types";

export const getStream = async ({
  link,
  type,
  signal,
  providerContext,
}: {
  link: string;
  type: string;
  signal: AbortSignal;
  providerContext: ProviderContext;
}): Promise<Stream[]> => {
  const { axios } = providerContext;
  
  // `link` here is the `movie_id`
  const url = `https://krmzitv.app/wp-json/api-3chk/v1/movie-stream?movie_id=${link}`;
  
  try {
    const response = await axios.get(url, { signal });
    
    if (response.data?.m3u8_url) {
      return [
        {
          server: "TurkMood",
          link: response.data.m3u8_url,
          type: "m3u8",
          quality: "1080",
        }
      ];
    }
    return [];
  } catch (error) {
    console.error(`turkmood getStream error: ${error}`);
    return [];
  }
};
