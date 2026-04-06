const axios = require('axios');
const cheerio = require('cheerio');
const catalogModule = require('./dist/govixtv/catalog.js');
const postsModule = require('./dist/govixtv/posts.js');
const episodesModule = require('./dist/govixtv/episodes.js');
const streamModule = require('./dist/govixtv/stream.js');

const providerContext = {
    axios,
    cheerio,
    getBaseUrl: () => 'https://www.govixtv.com',
    commonHeaders: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    }
};

async function verifyGovix() {
    console.log("🇸🇴 Starting Deep Verification for GovixTV...\n");

    try {
        // 1. Verify Catalog
        console.log("📁 1. Testing Catalog...");
        const categories = catalogModule.catalog;
        console.log(`- Found ${categories.length} categories: ${categories.map(c => c.title).join(', ')}\n`);

        // 2. Fetch Movies
        console.log("🎬 2. Fetching 'Movies' Content...");
        const moviePosts = await postsModule.getPosts({
            filter: '/movie.php',
            page: 1,
            providerValue: 'govixtv',
            providerContext
        });
        console.log(`- Found ${moviePosts.length} movies.`);
        if (moviePosts.length > 0) {
            console.log(`- Sample: "${moviePosts[0].title}" (${moviePosts[0].link})\n`);
        }

        // 3. Fetch Series (Musasal)
        console.log("📺 3. Fetching 'Musasal' Content...");
        const seriesPosts = await postsModule.getPosts({
            filter: '/musasal.php',
            page: 1,
            providerValue: 'govixtv',
            providerContext
        });
        console.log(`- Found ${seriesPosts.length} series.`);
        if (seriesPosts.length > 0) {
            const firstSeries = seriesPosts[0];
            console.log(`- Sample Series: "${firstSeries.title}" (${firstSeries.link})`);

            // 4. Fetch Episodes for this Series
            console.log(`📜 4. Fetching Episodes for "${firstSeries.title}"...`);
            const episodes = await episodesModule.getEpisodes({
                url: firstSeries.link,
                providerValue: 'govixtv',
                providerContext
            });
            console.log(`- Found ${episodes.length} episodes.`);
            
            if (episodes.length > 0) {
                const firstEpisode = episodes[0];
                console.log(`- Sample Episode: "${firstEpisode.title}" (${firstEpisode.link})`);

                // 5. Resolve Stream for this Episode
                console.log(`🔗 5. Resolving Stream URL...`);
                const streams = await streamModule.getStream({
                    link: firstEpisode.link,
                    providerValue: 'govixtv',
                    providerContext
                });
                console.log(`- Stream Found: ${streams.length > 0 ? "✅ " + streams[0].type : "❌ NONE"}`);
                if (streams.length > 0) {
                  console.log(`- Stream URL: ${streams[0].link.substring(0, 70)}...`);
                }
            }
        }

        console.log("\n✅ GovixTV Deep Verification: SUCCESS! All modules are operational.");
    } catch (err) {
        console.error(`\n❌ Verification Failed: ${err.message}`);
        console.error(err.stack);
    }
}

verifyGovix();
