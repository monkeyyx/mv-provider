export async function superVideoExtractor(data: any) {
  try {
    // Step 1: Extract the function parameters and the encoded string
    const functionRegex =
      /eval\(function\((.*?)\)\{.*?return p\}.*?\('(.*?)'\.split/;
    const match = functionRegex.exec(data);
    let p = "";
    if (match) {
      // var params = match[1].split(',').map(param => param.trim());
      const encodedString = match[2];

      // console.log('Parameters:', params);
      // console.log('Encoded String:', encodedString.split("',36,")[0], '🔥🔥');

      p = encodedString.split("',36,")?.[0].trim();
      const a = 36;
      let c = encodedString.split("',36,")[1].slice(2).split("|").length;
      const k = encodedString.split("',36,")[1].slice(2).split("|");

      while (c--) {
        if (k[c]) {
          const regex = new RegExp("\\b" + c.toString(a) + "\\b", "g");
          p = p.replace(regex, k[c]);
        }
      }

      // console.log('Decoded String:', p);
    } else {
      console.log("No match found");
    }

    const streamUrl = p?.match(/file:\s*"([^"]+\.m3u8[^"]*)"/)?.[1];
    console.log("streamUrl:", streamUrl);

    return streamUrl || "";
  } catch (err) {
    console.error("SuperVideoExtractor Error:", err);
    return "";
  }
}
