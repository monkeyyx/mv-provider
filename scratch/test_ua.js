const axios = require('axios');

async function testUAs() {
    const url = 'https://www.govixtv.com/movie.php';
    
    const mobileUA = "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36";
    const desktopUA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

    console.log("Testing MOBILE UA...");
    try {
        const resMobile = await axios.get(url, { headers: { 'User-Agent': mobileUA } });
        console.log(`Mobile Status: ${resMobile.status}`);
        if (resMobile.data.includes('suu player')) {
            console.log("❌ MOBILE UA IS BLOCKED (Suu Player detected)");
        } else {
            console.log("✅ MOBILE UA IS NOT BLOCKED");
        }
    } catch (e) {
        console.log(`Mobile Error: ${e.message}`);
    }

    console.log("\nTesting DESKTOP UA...");
    try {
        const resDesktop = await axios.get(url, { headers: { 'User-Agent': desktopUA } });
        console.log(`Desktop Status: ${resDesktop.status}`);
        if (resDesktop.data.includes('suu player')) {
            console.log("❌ DESKTOP UA IS BLOCKED (Suu Player detected)");
        } else {
            console.log("✅ DESKTOP UA IS NOT BLOCKED");
        }
    } catch (e) {
        console.log(`Desktop Error: ${e.message}`);
    }
}

testUAs();
