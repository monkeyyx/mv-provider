import { chromium } from 'playwright';

async function inspect() {
    console.log('🚀 Launching Deep Inspector...');
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });

    const page = await context.newPage();

    // Monitor ALL network traffic
    page.on('request', request => {
        const url = request.url();
        if (url.includes('backendfetch') || url.includes('terminator') || url.includes('rive') || url.includes('valhalla')) {
            console.log('\n🎯 [MATCH FOUND]');
            console.log('URL:', url);
            console.log('Method:', request.method());
            console.log('Headers:', JSON.stringify(request.headers(), null, 2));
        }
    });

    try {
        console.log('🌐 Navigating to The Boys (S1:E1)...');
        await page.goto('https://lordflix.org/watch/tv/76479/1/1', { waitUntil: 'networkidle', timeout: 60000 });
        
        console.log('⏳ Waiting for player initialization...');
        await page.waitForTimeout(5000);

        // Click the play overlay if it exists
        const playOverlay = await page.$('.vjs-big-play-button, #play-button');
        if (playOverlay) {
            console.log('🖱️ Clicking Play button...');
            await playOverlay.click();
        }

        console.log('⏳ Monitoring stream requests for 15 seconds...');
        await page.waitForTimeout(15000);

    } catch (e) {
        console.error('❌ Error during inspection:', e.message);
    } finally {
        await browser.close();
        console.log('\n🏁 Inspection complete.');
    }
}

inspect();
