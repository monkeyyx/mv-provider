import axios from "axios";
import * as cheerio from "cheerio";
import { getPosts } from "../providers/turkmood/posts";
import { getMetaData } from "../providers/turkmood/meta";
import { getStream } from "../providers/turkmood/stream";

const providerContext: any = {
  axios,
  cheerio,
  commonHeaders: {},
  getBaseUrl: async () => "",
};

async function test() {
  console.log("Testing Posts...");
  const posts = await getPosts({
    filter: "movies",
    page: 1,
    providerValue: "turkmood",
    signal: AbortSignal.timeout(10000),
    providerContext
  });
  console.log("Posts length:", posts.length);
  if (posts.length > 0) {
    console.log("First post:", posts[0]);
    const id = posts[0].link;
    console.log(`\nTesting Meta for ID: ${id}...`);
    const meta = await getMetaData({
      link: id,
      provider: "turkmood",
      providerContext
    });
    console.log("Meta title:", meta.title);
    console.log("Meta direct links:", meta.linkList[0].directLinks);
    
    console.log(`\nTesting Stream for ID: ${id}...`);
    const stream = await getStream({
      link: id,
      type: "movie",
      signal: AbortSignal.timeout(10000),
      providerContext
    });
    console.log("Stream result:", stream);
  }
}

test().catch(console.error);
