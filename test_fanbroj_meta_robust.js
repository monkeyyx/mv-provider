const axios = require('axios');

async function testMetaData() {
  const providerContext = {
    axios: axios.create(),
    commonHeaders: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    }
  };

  const getMeta = require('./dist/fanbroj/meta.js').getMeta;
  const baseUrl = "https://fanbroj.net";

  console.log("🧪 Starting Robust Meta Data Verification for Fanbroj...\n");

  const testCases = [
    { name: "Movie: Flight Risk", link: "/movies/flight-risk-2025" },
    { name: "Series: Founder: Orhan", link: "/series/founder-orhan" }
  ];

  for (const test of testCases) {
    console.log(`🎬 Testing Case: ${test.name} (${test.link})`);
    try {
      const info = await getMeta({
        link: test.link,
        provider: "fanbroj",
        providerContext
      });

      console.log(`   ✅ Title: ${info.title}`);
      console.log(`   ✅ Type: ${info.type}`);
      console.log(`   ✅ Image URL: ${info.image ? 'Found' : 'MISSING'}`);
      console.log(`   ✅ Synopsis: ${info.synopsis ? info.synopsis.substring(0, 50) + "..." : 'MISSING'}`);
      console.log(`   ✅ IMDB ID: ${info.imdbId || 'N/A'}`);
      console.log(`   ✅ Rating: ${info.rating || 'N/A'}`);
      console.log(`   ✅ Cast: ${info.cast ? info.cast.slice(0, 3).join(', ') : 'MISSING'}`);
      
      if (info.type === 'movie') {
        console.log(`   📦 Movie Links: ${info.linkList[0]?.directLinks?.length || 0} servers found`);
        if (info.linkList[0]?.directLinks && info.linkList[0].directLinks.length > 0) {
          console.log(`      Sample: ${info.linkList[0].directLinks[0].title} -> ${info.linkList[0].directLinks[0].link}`);
        }
      } else {
        console.log(`   📺 Series episodesLink: ${info.linkList[0]?.episodesLink || 'MISSING'}`);
      }
      console.log("");
    } catch (error) {
      console.log(`   ❌ FAILED: ${error.message}\n`);
    }
  }

  console.log("✅ Robust Meta Data Verification Completed!");
}

testMetaData();
