const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');
const Crypto = {
    digest: (algo, data) => Promise.resolve(data) // Mock digest
};

// Mock provider context
const providerContext = {
    axios,
    cheerio,
    Crypto,
    getBaseUrl: (p) => 'https://www.govixtv.com', // Mock
    commonHeaders: {}
};

const providers = ['govixtv'];

providers.forEach(p => {
    try {
        console.log(`Testing provider: ${p}`);
        
        // 1. Load Catalog
        const catalogPath = path.join(__dirname, 'dist', p, 'catalog.js');
        const catalogModule = require(catalogPath);
        console.log(`- Catalog: OK (${catalogModule.catalog.length} categories)`);
        
        // 2. Load Posts
        const postsPath = path.join(__dirname, 'dist', p, 'posts.js');
        const postsModule = require(postsPath);
        
        // 3. Test Search
        console.log(`- Testing Search...`);
        postsModule.getSearchPosts({
            searchQuery: "A",
            page: 1,
            providerValue: p,
            providerContext
        }).then(posts => {
            console.log(`- Search: OK (${posts.length} results)`);
        }).catch(err => {
            console.error(`- Search: FAIL (${err.message})`);
        });

    } catch (err) {
        console.error(`- Error: ${err.message}`);
    }
});
