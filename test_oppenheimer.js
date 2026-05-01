const { getStream } = require("./dist/lordflix/stream.js");
const axios = require("axios");
const cheerio = require("cheerio");

const providerContext = {
  axios,
  cheerio,
  commonHeaders: {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  },
  getBaseUrl: async (provider) => {
    const res = await fetch("https://himanshu8443.github.io/providers/modflix.json");
    const data = await res.json();
    return data[provider]?.url || "";
  },
};

async function testOppenheimer() {
  console.log("🚀 Testing Oppenheimer (TMDB: 872585) extraction...");
  
  const payload = JSON.stringify({
    title: "Oppenheimer",
    tmdbId: "872585",
    type: "movie",
  });

  try {
    const streams = await getStream({
      link: payload,
      type: "movie",
      providerContext,
    });

    console.log(`\n✅ Found ${streams.length} streams:`);
    streams.forEach((s, i) => {
      console.log(`${i + 1}. [${s.server}] -> ${s.link.substring(0, 100)}...`);
      if (s.headers) console.log(`   Headers: ${JSON.stringify(s.headers)}`);
    });
  } catch (err) {
    console.error("❌ Test failed:", err);
  }
}

testOppenheimer();
