
const axios = require('axios');
const cheerio = require('cheerio');

// Mock ProviderContext
const providerContext = {
    axios: axios.create({ timeout: 15000 }),
    cheerio,
    commonHeaders: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    }
};

async function deepAnalyze() {
    const streamModule = require('./dist/fanbroj/stream.js');
    const episodeLink = 'https://idaawo.xyz/video/8a146f1a3da4700cbf03cdc55e2daae6';
    
    console.log("🔍 Deep Analysis: Resolving stream for", episodeLink);
    
    try {
        const streams = await streamModule.getStream({
            link: episodeLink,
            providerValue: 'fanbroj',
            providerContext,
            signal: new AbortController().signal
        });
        
        console.log(`✅ Streams resolved: ${streams.length}`);
        
        if (streams.length > 0) {
            const stream = streams[0];
            console.log("📡 Testing Stream URL:", stream.link);
            console.log("🔧 Stream Headers:", JSON.stringify(stream.headers, null, 2));
            
            console.log("\n📥 Fetching stream content...");
            const res = await axios.get(stream.link, {
                headers: stream.headers,
                validateStatus: false
            });
            
            console.log(`📊 Response Status: ${res.status} ${res.statusText}`);
            console.log(`📝 Content-Type: ${res.headers['content-type']}`);
            
            const firstChars = typeof res.data === 'string' ? res.data.substring(0, 500) : "Binary data/Buffer";
            console.log(`📄 Content Start: \n${firstChars}\n`);
            
            if (typeof res.data === 'string' && res.data.startsWith("#EXTM3U")) {
                console.log("✅ SUCCESS: Valid HLS playlist received.");
            } else {
                console.log("❌ FAILURE: Non-M3U8 response received!");
                if (typeof res.data === 'string' && res.data.toLowerCase().includes("<html")) {
                    console.log("⚠️ Insight: Received an HTML page. Likely a security challenge or 403 error.");
                }
            }
        }
    } catch (err) {
        console.error("❌ Error during analysis:", err.message);
    }
}

deepAnalyze();
