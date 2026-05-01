import axios from "axios";
import * as cheerio from "cheerio";
import { getStream } from "../providers/hdtoday/stream";
import { getPosts, getSearchPosts } from "../providers/hdtoday/posts";
import { getMeta } from "../providers/hdtoday/meta";
import { getEpisodeLinks } from "../providers/hdtoday/episodes";
import { catalog, genres } from "../providers/hdtoday/catalog";

const providerContext: any = {
  axios,
  cheerio,
  Aes: {},
  commonHeaders: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  },
  getBaseUrl: async () => "",
};

async function testHDToday() {
  console.log("🚀 Starting HDToday Provider Test...\n");
  console.log("=".repeat(60));

  // ── 1. Catalog Structure ──
  console.log("\n📋 1. Catalog Structure:");
  console.log(`   Categories: ${catalog.length}`);
  catalog.forEach((c) => console.log(`     - ${c.title} (${c.filter})`));
  console.log(`   Genres: ${genres.length}`);
  genres.slice(0, 5).forEach((g) => console.log(`     - ${g.title}`));
  console.log(`     ... and ${genres.length - 5} more`);

  // ── 2. Discovery (Cinemeta catalog) ──
  console.log("\n" + "=".repeat(60));
  console.log("📺 2. Testing Discovery (getPosts - movie/top)...");
  try {
    const posts = await getPosts({
      filter: "movie/top",
      page: 1,
      providerValue: "hdtoday",
      signal: new AbortController().signal,
      providerContext,
    });
    if (posts.length > 0) {
      console.log(`   ✅ Found ${posts.length} top movies!`);
      console.log(`   Sample: "${posts[0].title}" → ${posts[0].link}`);
      console.log(`   Image: ${posts[0].image.substring(0, 60)}...`);
    } else {
      console.log("   ❌ No posts returned");
    }
  } catch (e: any) {
    console.log(`   ❌ Posts error: ${e.message}`);
  }

  // ── 3. Search ──
  console.log("\n" + "=".repeat(60));
  console.log('🔍 3. Testing Search (getSearchPosts - "batman")...');
  try {
    const search = await getSearchPosts({
      searchQuery: "batman",
      page: 1,
      providerValue: "hdtoday",
      signal: new AbortController().signal,
      providerContext,
    });
    if (search.length > 0) {
      console.log(`   ✅ Found ${search.length} search results!`);
      search.slice(0, 3).forEach((s) => console.log(`     - "${s.title}" (${s.link})`));
    } else {
      console.log("   ❌ No search results");
    }
  } catch (e: any) {
    console.log(`   ❌ Search error: ${e.message}`);
  }

  // ── 4. Metadata (Cinemeta) ──
  console.log("\n" + "=".repeat(60));
  console.log("📄 4. Testing Metadata (getMeta - Interstellar tt0816692)...");
  try {
    const meta = await getMeta({
      link: "tt0816692",
      type: "movie",
      signal: new AbortController().signal,
      providerContext,
    });
    if (meta) {
      console.log(`   ✅ Title: ${meta.title}`);
      console.log(`   Synopsis: ${(meta.synopsis || "").substring(0, 80)}...`);
      console.log(`   IMDB ID: ${meta.imdbId}`);
      console.log(`   Rating: ${meta.rating}`);
      console.log(`   Tags: ${(meta.tags || []).join(", ")}`);
    } else {
      console.log("   ❌ No metadata returned");
    }
  } catch (e: any) {
    console.log(`   ❌ Meta error: ${e.message}`);
  }

  // ── 5. Episodes ──
  console.log("\n" + "=".repeat(60));
  console.log("📑 5. Testing Episodes (getEpisodeLinks - Breaking Bad tt0903747)...");
  try {
    const episodes = await getEpisodeLinks({
      link: "tt0903747",
      signal: new AbortController().signal,
      providerContext,
    });
    if (episodes.length > 0) {
      console.log(`   ✅ Found ${episodes.length} episodes!`);
      episodes.slice(0, 5).forEach((e) => console.log(`     - ${e.title} → ${e.link}`));
      console.log(`     ... and ${episodes.length - 5} more`);
    } else {
      console.log("   ❌ No episodes returned");
    }
  } catch (e: any) {
    console.log(`   ❌ Episodes error: ${e.message}`);
  }

  // ── 6. Stream Resolution (CORE TEST) ──
  console.log("\n" + "=".repeat(60));
  console.log("🎬 6. Testing Stream Resolution (Interstellar tt0816692)...");
  console.log("   Uses Cinemeta → Videasy → Backend decrypt pipeline\n");
  try {
    const streams = await getStream({
      link: "tt0816692",
      type: "movie",
      signal: new AbortController().signal,
      providerContext,
    });

    if (streams.length > 0) {
      console.log(`   ✅ Successfully found ${streams.length} streams!`);
      streams.forEach((s, i) => {
        console.log(`   [${i + 1}] ${s.server} - ${s.quality || "?"}p - ${s.type}`);
        console.log(`       Link: ${s.link.substring(0, 80)}...`);
        if (s.subtitles && s.subtitles.length > 0) {
          console.log(`       Subtitles: ${s.subtitles.length} tracks`);
        }
      });
    } else {
      console.log("   ⚠️  No streams found (Videasy backend may be temporarily down)");
    }
  } catch (e: any) {
    console.log(`   ⚠️  Stream error: ${e.message}`);
  }

  // ── 7. Series Stream ──
  console.log("\n" + "=".repeat(60));
  console.log("📺 7. Testing Series Stream (The Boys S1E1 - tt7602722:1:1)...");
  try {
    const seriesStreams = await getStream({
      link: "tt7602722:1:1",
      type: "series",
      signal: new AbortController().signal,
      providerContext,
    });

    if (seriesStreams.length > 0) {
      console.log(`   ✅ Found ${seriesStreams.length} series streams!`);
      seriesStreams.forEach((s, i) => {
        console.log(`   [${i + 1}] ${s.server} - ${s.quality || "?"}p`);
      });
    } else {
      console.log("   ⚠️  No series streams found (Videasy backend may be temporarily down)");
    }
  } catch (e: any) {
    console.log(`   ⚠️  Series stream error: ${e.message}`);
  }

  console.log("\n" + "=".repeat(60));
  console.log("🏁 HDToday Provider Test Complete!\n");
}

testHDToday();
