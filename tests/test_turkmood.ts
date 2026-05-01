import axios from "axios";
import * as cheerio from "cheerio";
import { getPosts } from "../providers/turkmood/posts";
import { getMeta } from "../providers/turkmood/meta";
import { getEpisodes } from "../providers/turkmood/episodes";
import { getStream } from "../providers/turkmood/stream";

const providerContext: any = {
  axios,
  cheerio,
  commonHeaders: {},
  getBaseUrl: async () => "",
};

async function test() {
  console.log("=== Testing Posts (Movies) ===");
  const posts = await getPosts({
    filter: "movies",
    page: 1,
    providerValue: "turkmood",
    signal: AbortSignal.timeout(10000),
    providerContext
  });
  console.log("Posts length:", posts.length);
  if (posts.length > 0) {
    const id = posts[0].link;
    console.log(`\nTesting Meta for ID: ${id}...`);
    const meta = await getMeta({
      link: id,
      provider: "turkmood",
      providerContext
    });
    console.log("Meta title:", meta.title, "Type:", meta.type);
    
    console.log(`\nTesting Stream for ID: ${id}...`);
    const stream = await getStream({
      link: id,
      type: "movie",
      signal: AbortSignal.timeout(10000),
      providerContext
    });
    console.log("Stream result:", stream);
  }

  console.log("\n=== Testing Series (مسلسل ضد القدر مدبلج - 23676) ===");
  const seriesId = "23676";
  const seriesMeta = await getMeta({
    link: seriesId,
    provider: "turkmood",
    providerContext
  });
  console.log("Series Meta title:", seriesMeta.title, "Type:", seriesMeta.type);
  console.log("EpisodesLink:", seriesMeta.linkList[0].episodesLink);

  if (seriesMeta.linkList[0].episodesLink) {
    console.log("\nTesting getEpisodes...");
    const episodes = await getEpisodes({
      url: seriesMeta.linkList[0].episodesLink,
      providerContext
    });
    console.log(`Found ${episodes.length} episodes. First episode:`, episodes[0]);

    if (episodes.length > 0) {
      console.log(`\nTesting Stream for Series Episode 0...`);
      const episodeStream = await getStream({
        link: episodes[0].link,
        type: "series",
        signal: AbortSignal.timeout(10000),
        providerContext
      });
      console.log("Series Stream result:", episodeStream);
    }
  }
}

test().catch(console.error);
