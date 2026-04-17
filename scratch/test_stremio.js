const stremio = require('../api/stremio.js');

async function test() {
  console.log("--- Testing Manifest ---");
  const reqManifest = { 
    url: '/manifest.json', 
    headers: { 'user-agent': 'Stremio/1.6.0' } 
  };
  const resManifest = {
    setHeader: () => {},
    json: (data) => console.log('Manifest:', JSON.stringify(data, null, 2)),
    status: (code) => ({ json: (d) => console.log(`Error ${code}:`, d), end: () => {} })
  };
  await stremio(reqManifest, resManifest);

  console.log("\n--- Testing Stream (Big Buck Bunny tt0452694) ---");
  const reqStream = { 
    url: '/stream/movie/tt0452694.json', 
    headers: { 'user-agent': 'Stremio/1.6.0' } 
  };
  const resStream = {
    setHeader: () => {},
    json: (data) => console.log('Streams found:', data.streams.length, data.streams.map(s => s.name).join(', ')),
    status: (code) => ({ json: (d) => console.log(`Error ${code}:`, d), end: () => {} })
  };
  await stremio(reqStream, resStream);
}

test().catch(console.error);
