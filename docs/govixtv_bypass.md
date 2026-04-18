# GovixTV Bypass & Suu Player Fix Documentation

## Overview
This document outlines the implementation details for bypassing the GovixTV Somali phone login requirement and the "Suu Player" (Account Expired) overlay. These restrictions previously blocked playback in the Vega App by requiring a valid local phone number or an active subscription session.

## Problem Description
1. **Phone Login**: GovixTV requires a Somali phone number (8 digits) for access.
2. **Suu Player / Account Expired**: A web-based overlay that blocks the player if it detects an expired session or specific cookies.
3. **Session Tracking**: The server uses cookies to track sessions, which often lead to "Account Expired" blocks even when bypassing the initial login.

## Solution Strategy

### 1. Random Phone Generation
To bypass the login screen, we programmatically generate a random 8-digit phone number.
- **Requirement**: Must be exactly 8 digits.
- **Requirement**: Must NOT start with `61` (as this prefix is often flagged or requires actual OTP).
- **Implementation**: `generateRandomPhone()` in `stream.ts`.

### 2. "Incognito" Session Handling
The most critical part of the bypass is ensuring that **no cookies** are sent to the server. This prevents the server from linking the request to a restricted session.
- **Action**: All axios requests (GET/POST) include `Cookie: ""`.
- **Action**: The final HLS stream object returned to the app includes `Cookie: ""` in its headers.

### 3. Direct HLS Extraction
By extracting the `.m3u8` URL directly from the page source and passing it to the native player, we completely bypass the HTML/JS layers where "Suu Player" overlays are rendered.

### 4. Header Injection
The native player must mimic a standard desktop browser to avoid being flagged.
- **User-Agent**: `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ...`
- **Referer**: Must match the source page (e.g., `https://www.govixtv.com/player.php?id=...`).
- **Origin**: `https://www.govixtv.com`.

## Implementation Details

### Provider logic (`vega-providers`)
- **`govixtv/stream.ts`**:
    - Generates random phone.
    - Performs an initial GET to the player page.
    - Performs a POST with the phone number and `Cookie: ""`.
    - Regex-extracts the `.m3u8` link (including parameters like `sig`).
    - Packages the link with incognito headers.
- **`govixtv/posts.ts`, `meta.ts`, `episodes.ts`**: 
    - Updated to use `Cookie: ""` for all discovery requests to ensure metadata fetching isn't blocked.

### App logic (`vega-app`)
- The app uses the headers provided by the `Stream` object. No specific overrides are needed in `constants.ts` as long as the provider returns the correct headers.

## Verification
A standalone script `verify_govix.js` is available in the `vega-providers` root to test the entire flow:
```bash
# To run verification:
# 1. Build the providers
npm run build
# 2. Run the script
node verify_govix.js
```

## Maintenance Notes
- **IP Tracking**: If GovixTV moves to server-side IP tracking, a random phone might not be enough, and proxy rotation might be required.
- **Fingerprinting**: If the bypass stops working, check if they have introduced new mandatory query parameters in the player URL or updated their regex for UA detection.
