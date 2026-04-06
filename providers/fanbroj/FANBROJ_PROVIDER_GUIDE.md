# Technical Deep-Dive: Fanbroj Provider Implementation

This document provides a detailed explanation of the logic, discovery process, and problem-solving strategies used to build the **Fanbroj** provider and its associated video hosting resolver (**Idaawo/Xamaali**).

---

## 1. Discovery Phase: Finding the "Hidden" APIs

When building modern providers, **API-First** is always superior to **HTML Scraping**. Scraping is fragile and breaks with minor UI changes; APIs are stable and return structured data.

### How I found them:

By monitoring the Browser Network Tab while interacting with `fanbroj.net`, I identified three key internal endpoints:

1.  **Lising API**: `https://fanbroj.net/api/movies?page=1` (Returns movies and total counts).
2.  **Series API**: `https://fanbroj.net/api/series` (Returns a direct array of shows).
3.  **Episode API**: `https://fanbroj.net/api/series/[slug]/episodes` (Returns a nested object mapping seasons to episodes).

> [!TIP]
> Always look for `XHR/Fetch` requests in the browser console first. Usually, modern sites built with Next.js or React have internal APIs that provide 10x the data with 1/10th of the parsing effort.

---

## 2. Solving the Extraction Puzzle

### Handling Movies vs. Series

The Fanbroj backend treats Movies and Series differently.

- **Movies** are objects within a `movies` property.
- **Series** (TV Shows) are returned as a flat array.

**Solution**: I implemented a conditional check in `posts.ts` that detects the category and adjusts the parsing logic accordingly:

```typescript
const items = isSeries ? res.data : res.data.movies || [];
```

### Mapping Metadata

Fanbroj uses high-quality TMDB data. I mapped their custom field names (e.g., `posterUrl`, `backdropUrl`, `overview`) to our internal `Info` interface to ensure the app displays premium visuals and descriptions.

---

## 3. The Big Challenge: Bypassing the Video Player

The video host (**xamaali.cfd** / **idaawo.xyz**) uses a custom version of JWPlayer called **FirePlayer**. This player is designed to prevent direct link extraction.

### Problem 1: Hidden Stream URL

The HLS manifest URL is not in the source code. It is fetched dynamically after the page loads.

### Problem 2: Security Error (403 Forbidden)

Directly accessing the manifest returns a "Security Error" because it checks for:

1.  **Referer**: Must be the player's parent page.
2.  **User-Agent**: Must look like a real browser.
3.  **Session**: Often requires a POST request to "unlock" the manifest.

### The Solution: The `getVideo` Bypass

I observed that the player makes a synchronous POST request to a specific endpoint to retrieve the stream.

- **Endpoint**: `[Origin]/player/index.php?data=[ID]&do=getVideo`
- **Method**: `POST`
- **Payload**: `data=[ID]&do=getVideo`

**Implementation in `stream.ts`**:

```typescript
const res = await axios.post(playerUrl, `data=${id}&do=getVideo`, {
  headers: {
    ...commonHeaders,
    "Content-Type": "application/x-www-form-urlencoded",
    Referer: link, // Crucial: The player page
  },
});
```

### The ".txt" manifest trick

The server returns a URL ending in `.txt` (e.g., `master.txt`). This is a legitimate M3U8 file masked as text. I forced the player type to `hls` to ensure the app treats it correctly as a stream.

---

## 4. Problem Solving & Advanced Logic

### 26-Minute Preview Limit

Sites like these often have a session-based timeout.
**Solution**: By propagating the `User-Agent` and `Referer` from our internal `axios` instance down to the streaming headers, we mimic a valid browser session for every segment request, which often avoids the "Trial Limit" restrictions used on low-res free players.

### Genre Filtering

The user requested specific filters (Action, Thriller, etc.).

- **Discovery**: Testing the API URL `?genres=Action` showed that the backend supports server-side filtering.
- **Implementation**: In `catalog.ts`, I defined a custom filter format (`genre:Action`). In `posts.ts`, I intercept this prefix and transform it into the correct API query.

---

## 5. Advice for Future Providers

1.  **Monitor Subdomains**: Hosting providers like `xamaali` often rotate subdomains (e.g., `lugta.cfd`, `beensheeg.cfd`). Always extract the origin dynamically from the link instead of hardcoding it.
2.  **Header Continuity**: Always pass the `Referer` of the host site. If you are scraping the stream, the `Referer` should be the iframe URL; for segments, it should be the host origin.
3.  **Use Headers.ts**: If a site has deep anti-bot (like Cloudflare), use the project's common headers or a specific rotating User-Agent to stay "under the radar".
4.  **Pagination is Key**: Fanbroj supports `&page=N`. Implementing this in `getPosts` ensures users can scroll through all 1,200+ movies without performance lag.

---

**Built with 🇸🇴 pride for the Vega/Govix community.**

https://xamaali.cfd/video/a098b2eb3138551138d127925d092d67
