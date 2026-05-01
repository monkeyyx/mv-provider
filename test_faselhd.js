const path = require("path");

async function testFaselHD() {
  try {
    const streamModule = require(path.join(__dirname, "dist", "faselhd", "stream.js"));
    
    console.log("Testing FaselHD Provider...");
    const mockContext = {
      commonHeaders: {}
    };

    // Testing a known TMDB Movie ID. Let's try Deadpool (293660) or any valid string.
    const result = await streamModule.GetStream({
      link: "293660",
      type: "movie",
      signal: new AbortController().signal,
      providerContext: mockContext
    });

    console.log("Result:", JSON.stringify(result, null, 2));
    
    if (result && result.length > 0) {
      console.log("✅ FaselHD test passed! Found streams.");
    } else {
      console.log("⚠️ FaselHD test finished, but no streams returned. This might be due to an invalid TMDB ID or the backend being down.");
    }
  } catch (error) {
    console.error("❌ Test failed with error:", error);
  }
}

testFaselHD();
