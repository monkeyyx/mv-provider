const TMDB_ID = '76479';
const SEASON = '1';
const EPISODE = '1';

const url = `https://lordflix.org/watch/tv/${TMDB_ID}/${SEASON}/${EPISODE}/__data.json?x-sveltekit-invalidated=10`;

async function extract() {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://lordflix.org/',
        'x-sveltekit-load': 'true',
      }
    });

    const data = await response.text();
    // Use Bun's write to save the file
    await Bun.write('/Users/elkenzi/sandbox/tools/vega-providers/scratch/lordflix_dump.json', data);
    console.log('✅ Full Data Dumped to lordflix_dump.json');

  } catch (error) {
    console.error(`❌ Extraction Failed: ${error.message}`);
  }
}

extract();
