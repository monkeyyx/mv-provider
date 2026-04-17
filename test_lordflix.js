const axios = require("axios");
const cheerio = require("cheerio");

// Simulate providerContext
const providerContext = {
  axios,
  cheerio,
  commonHeaders: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  },
  getBaseUrl: async (provider) => {
    const res = await fetch(
      "https://himanshu8443.github.io/providers/modflix.json"
    );
    const data = await res.json();
    return data[provider]?.url || "";
  },
};

async function testCatalog() {
  console.log("\n===== 1. CATALOG TEST =====");
  const { catalog } = require("./dist/lordflix/catalog.js");
  console.log("Catalogs:", catalog.map((c) => c.title).join(", "));
  return catalog.length > 0;
}

async function testPosts() {
  console.log("\n===== 2. POSTS TEST =====");
  const { getPosts } = require("./dist/lordflix/posts.js");
  const posts = await getPosts({
    filter: "/top/catalog/movie/top.json",
    page: 1,
    providerValue: "lordflix",
    signal: AbortSignal.timeout(15000),
    providerContext,
  });
  console.log(`Got ${posts.length} posts`);
  if (posts.length > 0) {
    console.log("First post:", posts[0].title, "| Link:", posts[0].link);
    console.log("Image:", posts[0].image ? "✓" : "✗");
  }
  return posts.length > 0;
}

async function testSearch() {
  console.log("\n===== 3. SEARCH TEST =====");
  const { getSearchPosts } = require("./dist/lordflix/posts.js");
  const results = await getSearchPosts({
    searchQuery: "Interstellar",
    page: 1,
    providerValue: "lordflix",
    signal: AbortSignal.timeout(15000),
    providerContext,
  });
  console.log(`Search "Interstellar" returned ${results.length} results`);
  if (results.length > 0) {
    console.log("First result:", results[0].title);
  }
  return results.length > 0;
}

async function testMeta() {
  console.log("\n===== 4. META TEST (Movie) =====");
  const { getMeta } = require("./dist/lordflix/meta.js");
  const meta = await getMeta({
    link: "https://v3-cinemeta.strem.io/meta/movie/tt0816692.json",
    provider: "lordflix",
    providerContext,
  });
  console.log("Title:", meta.title);
  console.log("Type:", meta.type);
  console.log("IMDB:", meta.imdbId);
  console.log("Synopsis:", meta.synopsis?.slice(0, 80) + "...");
  console.log("Links:", meta.linkList?.length, "items");
  if (meta.linkList?.[0]?.directLinks?.[0]) {
    const link = meta.linkList[0].directLinks[0].link;
    console.log("Stream link payload:", link);
  }
  return meta.title !== "";
}

async function testMetaSeries() {
  console.log("\n===== 5. META TEST (Series) =====");
  const { getMeta } = require("./dist/lordflix/meta.js");
  const meta = await getMeta({
    link: "https://v3-cinemeta.strem.io/meta/series/tt2861424.json",
    provider: "lordflix",
    providerContext,
  });
  console.log("Title:", meta.title);
  console.log("Type:", meta.type);
  console.log("Seasons:", meta.linkList?.length);
  if (meta.linkList?.[0]) {
    console.log(
      "First season:",
      meta.linkList[0].title,
      "- Episodes:",
      meta.linkList[0].directLinks?.length
    );
  }
  return meta.type === "series" && meta.linkList?.length > 0;
}

async function testStream() {
  console.log("\n===== 6. STREAM TEST (Movie) =====");
  const { getStream } = require("./dist/lordflix/stream.js");

  // Interstellar: TMDB 157336, IMDB tt0816692
  const payload = JSON.stringify({
    title: "Interstellar",
    imdbId: "tt0816692",
    tmdbId: "157336",
    season: "",
    episode: "",
    type: "movie",
  });

  console.log("Fetching streams for Interstellar...");
  const streams = await getStream({
    link: payload,
    type: "movie",
    signal: AbortSignal.timeout(30000),
    providerContext,
  });

  console.log(`\nGot ${streams.length} streams total:`);
  streams.forEach((s, i) => {
    console.log(
      `  ${i + 1}. [${s.server}] ${s.type} ${s.quality || ""} => ${s.link?.slice(0, 80)}...`
    );
  });
  return streams.length > 0;
}

async function testStreamSeries() {
  console.log("\n===== 7. STREAM TEST (Series - Rick and Morty S1E1) =====");
  const { getStream } = require("./dist/lordflix/stream.js");

  const payload = JSON.stringify({
    title: "Rick and Morty",
    imdbId: "tt2861424",
    tmdbId: "60625",
    season: "1",
    episode: "1",
    type: "series",
  });

  console.log("Fetching streams for Rick and Morty S1E1...");
  const streams = await getStream({
    link: payload,
    type: "series",
    signal: AbortSignal.timeout(30000),
    providerContext,
  });

  console.log(`\nGot ${streams.length} streams total:`);
  streams.forEach((s, i) => {
    console.log(
      `  ${i + 1}. [${s.server}] ${s.type} ${s.quality || ""} => ${s.link?.slice(0, 80)}...`
    );
  });
  return streams.length > 0;
}

async function run() {
  const results = {};
  
  try { results.catalog = await testCatalog(); } catch (e) { console.error("CATALOG FAILED:", e.message); results.catalog = false; }
  try { results.posts = await testPosts(); } catch (e) { console.error("POSTS FAILED:", e.message); results.posts = false; }
  try { results.search = await testSearch(); } catch (e) { console.error("SEARCH FAILED:", e.message); results.search = false; }
  try { results.meta = await testMeta(); } catch (e) { console.error("META FAILED:", e.message); results.meta = false; }
  try { results.metaSeries = await testMetaSeries(); } catch (e) { console.error("META SERIES FAILED:", e.message); results.metaSeries = false; }
  try { results.stream = await testStream(); } catch (e) { console.error("STREAM FAILED:", e.message); results.stream = false; }
  try { results.streamSeries = await testStreamSeries(); } catch (e) { console.error("STREAM SERIES FAILED:", e.message); results.streamSeries = false; }

  console.log("\n\n========== RESULTS ==========");
  Object.entries(results).forEach(([k, v]) => {
    console.log(`  ${v ? "✅" : "❌"} ${k}`);
  });
  console.log("=============================\n");
}

run().catch(console.error);
