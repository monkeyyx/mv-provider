const axios = require("axios");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const cheerio = require("cheerio");

// Mock Aes for Node.js compatibility (replaces react-native-aes-crypto)
const Aes = {
  sha1: (input) => Promise.resolve(crypto.createHash("sha1").update(input).digest("hex")),
  encrypt: () => Promise.resolve(""), // Basic mocks
  decrypt: () => Promise.resolve(""),
};

// Provider Context for Node.js
const providerContext = {
  axios,
  cheerio,
  Aes,
  commonHeaders: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  },
  getBaseUrl: async (providerValue) => {
    try {
      const resp = await axios.get("https://himanshu8443.github.io/providers/modflix.json");
      const data = resp.data;
      // Map Vega to vega, etc.
      const key = providerValue === "Vega" ? "vega" : providerValue.toLowerCase();
      return data[key]?.url || data[providerValue]?.url || "";
    } catch (err) {
      console.error("getBaseUrl error:", err.message);
      return "";
    }
  },
};

// Helper to get title from IMDB ID using Cinemeta
async function getMetaFromImdbId(imdbId, type = "movie") {
  try {
    const resp = await axios.get(`https://v3-cinemeta.strem.io/meta/${type}/${imdbId}.json`);
    return resp.data.meta;
  } catch (err) {
    console.error(`Cinemeta error for ${imdbId}:`, err.message);
    return null;
  }
}

// Main handler
module.exports = async (req, res) => {
  const { url } = req;
  console.log(`Stremio request: ${url}`);

  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Route: /manifest.json
  if (url === "/manifest.json" || url === "/stremio/manifest.json" || url === "/api/stremio") {
    const isStremio = req.headers["user-agent"]?.toLowerCase().includes("stremio") || url.includes("stremio");
    
    if (isStremio) {
      const manifestPath = path.join(process.cwd(), "stremio-manifest.json");
      if (fs.existsSync(manifestPath)) {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
        return res.json(manifest);
      }
    } else {
      // Return original manifest for MV App
      const originalManifestPath = path.join(process.cwd(), "manifest.json");
      if (fs.existsSync(originalManifestPath)) {
        const manifest = JSON.parse(fs.readFileSync(originalManifestPath, "utf8"));
        return res.json(manifest);
      }
    }
    return res.status(404).json({ error: "Manifest not found" });
  }

  // Route: /stream/:type/:id.json
  const streamMatch = url.match(/\/stream\/(movie|series)\/(tt\d+)(?::(\d+):(\d+))?\.json/);
  if (streamMatch) {
    const [_, type, imdbId, season, episode] = streamMatch;
    console.log(`Searching streams for ${type} ${imdbId} ${season || ""}:${episode || ""}`);

    const meta = await getMetaFromImdbId(imdbId, type);
    if (!meta) return res.json({ streams: [] });

    const title = meta.name;
    const year = meta.releaseInfo || meta.year;

    // Search logic across providers
    const results = [];
    const providersToUse = ["vega", "flixhq", "primewire"]; // These have better search

    for (const providerValue of providersToUse) {
      try {
        const postsPath = path.join(process.cwd(), "dist", providerValue, "posts.js");
        const streamPath = path.join(process.cwd(), "dist", providerValue, "stream.js");

        if (!fs.existsSync(postsPath) || !fs.existsSync(streamPath)) continue;
        
        // Use a fresh require each time or handle cache if needed
        delete require.cache[require.resolve(postsPath)];
        delete require.cache[require.resolve(streamPath)];
        const postsModule = require(postsPath);
        const streamModule = require(streamPath);

        const getSearchPosts = postsModule.GetSearchPosts || postsModule.getSearchPosts;
        const getStream = streamModule.GetStream || streamModule.getStream;

        if (!getSearchPosts || !getStream) continue;

        // 1. Search for the title
        const posts = await getSearchPosts({
          searchQuery: title,
          page: 1,
          providerValue,
          signal: { aborted: false },
          providerContext,
        });

        if (posts && posts.length > 0) {
          // Find best match
          const bestMatch = posts.find(p => p.title.toLowerCase().includes(title.toLowerCase())) || posts[0];
          
          console.log(`Found match on ${providerValue}: ${bestMatch.title}`);

          // 2. Get streams
          const streams = await getStream({
            link: bestMatch.link,
            type,
            signal: { aborted: false },
            providerContext,
          });

          if (streams) {
            streams.forEach(s => {
              results.push({
                name: `Vega [${providerValue}]`,
                title: `${s.server} - ${s.quality || "HD"}\n${bestMatch.title}`,
                url: s.link,
                behaviorHints: {
                  notWebReady: true, // Most of these embed links are not web ready (need Referer etc)
                  proxyHeaders: s.headers,
                }
              });
            });
          }
        }
      } catch (err) {
        console.error(`Error with provider ${providerValue}:`, err.message);
      }
    }

    return res.json({ streams: results });
  }

  return res.status(404).json({ error: "Not found" });
};
