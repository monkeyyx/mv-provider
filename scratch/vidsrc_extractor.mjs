import { chromium } from 'playwright';

async function run() {
    console.log('🚀 Starting VidSrc Extractor...');
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });

    const page = await context.newPage();

    // Enable network interception
    page.on('request', request => {
        const url = request.url();
        if (url.includes('terminator.hasta-la-vista.site') || url.includes('media?v=')) {
            console.log('✅ FOUND SOURCE REQUEST:', url);
            console.log('Headers:', JSON.stringify(request.headers(), null, 2));
        }
        
        // Block known ads to prevent redirects
        const adDomains = ['highrevenuegate.com', 'cloutm.com', 'vidsrc.to/ads'];
        if (adDomains.some(domain => url.includes(domain))) {
            request.abort().catch(() => {});
        }
    });

    try {
        const targetUrl = 'https://vidsrc.to/embed/movie/872585';
        console.log(`🌐 Navigating to: ${targetUrl}`);
        
        await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
        
        console.log('⏳ Waiting for player to initialize...');
        await page.waitForTimeout(5000);

        // Try to click the play button if it exists (often an overlay)
        const playButton = await page.$('#play-button, .play, .vjs-big-play-button');
        if (playButton) {
            console.log('🖱️ Clicking play button...');
            await playButton.click();
        }

        // Wait for server list and click 'LordFlix' or others
        console.log('🔍 Looking for server list...');
        await page.waitForSelector('.server-item, #servers', { timeout: 10000 }).catch(() => console.log('Server list not found via selector'));

        const servers = await page.$$('.server-item, [data-hash]');
        console.log(`Found ${servers.length} server elements.`);

        for (const server of servers) {
            const text = await server.innerText();
            const hash = await server.getAttribute('data-hash');
            console.log(`📡 Server: ${text} | Hash: ${hash}`);
            
            // Try clicking each server to trigger the network request
            await server.click().catch(() => {});
            await page.waitForTimeout(2000);
        }

        console.log('🏁 Extraction complete. Keeping browser open for 10s to catch delayed requests...');
        await page.waitForTimeout(10000);

    } catch (error) {
        console.error('❌ Error during extraction:', error.message);
    } finally {
        await browser.close();
    }
}

run();
