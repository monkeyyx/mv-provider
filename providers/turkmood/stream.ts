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
  
  // `link` here is the `movie_id` or query string for episode
  const url = type === "series" 
    ? `https://krmzitv.app/wp-json/api-3chk/v1/episode?${link}`
    : `https://krmzitv.app/wp-json/api-3chk/v1/movie-stream?movie_id=${link}`;
  
  try {
    const response = await axios.get(url, { signal });
    
    if (response.data?.m3u8_url) {
      return [
        {
          server: "TurkMood",
          link: response.data.m3u8_url,
          type: "m3u8",
          quality: "1080",
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Referer": "https://krmzitv.app/",
            "Origin": "https://krmzitv.app"
          }
        }
      ];
    }
    return [];
  } catch (error) {
    console.error(`turkmood getStream error: ${error}`);
    return [];
  }
};
