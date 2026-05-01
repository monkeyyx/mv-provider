import axios from "axios";
import * as cheerio from "cheerio";
import { getStream } from "../providers/cineby/stream";

const providerContext: any = {
  axios,
  cheerio,
  Aes: {}, // Not needed for Cineby as it uses external backend for decryption
  commonHeaders: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  },
  getBaseUrl: async () => "",
};

async function testCineby() {
  console.log("🚀 Starting Cineby Provider Test...\n");

  try {
    // 1. Test Search (Posts) - Searching for "Interstellar"
    console.log("🔍 Testing Posts/Search (Interstellar)...");
    // const posts = ... (skipping search due to 401)

    // 2. Test Stream Resolution
    console.log(
      "\n📺 Testing Direct Stream Resolution for Interstellar (tt1559547)...",
    );
    const streams = await getStream({
      link: "tt1559547",
      type: "movie",
      signal: new AbortController().signal,
      providerContext,
    });

    if (streams.length > 0) {
      console.log(`✅ Successfully found ${streams.length} streams!`);
      streams.forEach((s, i) => {
        console.log(
          `   [${i + 1}] ${s.server} - ${s.quality}p - Link: ${s.link.substring(0, 60)}...`,
        );
      });
    } else {
      console.log("❌ No streams found for tt1559547");
    }

    // 3. Test Series Search (The Boys)
    console.log("\n🔍 Testing Direct Series Stream (tt7602722:1:1)...");
    const seriesStreams = await getStream({
      link: "tt7602722:1:1",
      type: "series",
      signal: new AbortController().signal,
      providerContext,
    });

    if (seriesStreams.length > 0) {
      console.log(`✅ Found ${seriesStreams.length} series streams!`);
    } else {
      console.log("❌ No series streams found.");
    }
  } catch (error: any) {
    if (error.response) {
      console.log(
        "Response Error:",
        error.response.status,
        error.response.data,
      );
    } else {
      console.error("\n💥 Test failed with error:", error.message);
    }
  }
}

testCineby();
