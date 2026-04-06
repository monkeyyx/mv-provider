const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');

// Mock Crypto for Node.js
const Crypto = {
  digest: (algo, data) => Promise.resolve(data),
};

// Mock provider context
const providerContext = {
  axios,
  cheerio,
  Crypto,
  getBaseUrl: (p) => {
    // Basic mapping for smoke test
    const hosts = {
        'govixtv': 'https://www.govixtv.com',
        'vega': 'https://vegadetails.club'
    };
    return hosts[p] || '';
  },
  commonHeaders: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  }
};

async function runSmokeTest() {
  const manifestPath = path.join(__dirname, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const results = [];

  console.log(`🚀 Starting A-Z Smoke Test for ${manifest.length} providers...\n`);

  for (const provider of manifest) {
    const p = provider.value;
    const result = {
      name: provider.display_name,
      value: p,
      catalog: 'SKIP',
      search: 'SKIP',
      errors: []
    };

    try {
      // 1. Test Catalog
      const catalogPath = path.join(__dirname, 'dist', p, 'catalog.js');
      if (fs.existsSync(catalogPath)) {
        const catalogModule = require(catalogPath);
        result.catalog = catalogModule.catalog && catalogModule.catalog.length > 0 ? `OK (${catalogModule.catalog.length})` : 'EMPTY';
      } else {
        result.catalog = 'MISSING';
      }

      // 2. Test Search (Lightweight)
      const postsPath = path.join(__dirname, 'dist', p, 'posts.js');
      if (fs.existsSync(postsPath) && result.catalog !== 'MISSING') {
        const postsModule = require(postsPath);
        try {
          if (postsModule.getSearchPosts) {
            const searchPromise = postsModule.getSearchPosts({
              searchQuery: "A",
              page: 1,
              providerValue: p,
              providerContext
            });

            // Timeout search after 6s to keep test moving
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Test Timeout')), 6000));
            const posts = await Promise.race([searchPromise, timeoutPromise]);
            
            result.search = posts && posts.length > 0 ? `OK (${posts.length} results)` : 'EMPTY';
          } else {
            result.search = 'NO_SEARCH_FUNC';
          }
        } catch (err) {
          result.search = `FAIL: ${err.message.substring(0, 30)}`;
          result.errors.push(`Search Error: ${err.message}`);
        }
      } else {
        result.search = result.catalog === 'MISSING' ? 'SKIP' : 'MISSING';
      }

    } catch (err) {
      result.errors.push(`System Error: ${err.message}`);
    }

    results.push(result);
    console.log(`[${results.length}/${manifest.length}] ${p.padEnd(20)} | Catalog: ${result.catalog.padEnd(10)} | Search: ${result.search}`);
  }

  // Generate Markdown Summary
  console.log('\n--- Final Summary ---\n');
  let table = '| Provider | Catalog | Search | Status |\n| :--- | :--- | :--- | :--- |\n';
  results.forEach(r => {
    const status = r.errors.length === 0 ? '✅' : '❌';
    table += `| ${r.name} | ${r.catalog} | ${r.search} | ${status} |\n`;
  });
  
  fs.writeFileSync('smoke_test_results.md', table);
  console.log('✅ Smoke test complete. Results saved to smoke_test_results.md');
}

runSmokeTest().catch(console.error);
