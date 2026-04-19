# Suu Player (`com.soodag.lives`) Reverse Engineering Report

This document outlines the findings from the reverse engineering of the Suu Player Android APK. These findings were used to implement a permanent bypass for GovixTV restrictions in the Vega ecosystem.

## 1. Authentication Mechanism: The "Skeleton Key"
The entire security model of the Suu Player infrastructure relies on a single hardcoded header.

*   **Header Name**: `ppkey`
*   **Secret Value**: `Hg4fPewbcGfBTskQQE5mktC2vgEHT9GX`

**Impact**: Any request (catalog, series, metadata, or stream) that includes this header is treated as a "trusted" request from an official Suu Player device, bypassing standard web-based restrictions.

---

## 2. Infrastructure & Endpoints
The backend is split across several domains, forming a white-label OTT infrastructure used to proxy GovixTV content.

### API Gateway (`xaliye4.online`)
*   **Movies Catalog**: `https://test.xaliye4.online/api/movies?page=all`
*   **Series Catalog**: `https://test.xaliye4.online/api/series`
*   **Series Episodes**: `https://test.xaliye4.online/api/series-videos/{ID}`
*   **Order Submission**: `https://test.xaliye4.online/orders2` (Endpoint for submitting subscription orders).
*   **User Validation**: `https://test.xaliye4.online/api/gov13?number={phone}`

### Token & Licensing Server (`orangegas.store`)
*   **Auth Token**: `https://orangegas.store/aaa.php?uid={device_id}`
*   **Testing Endpoint**: `https://orangegas.store/mmmtest.php` (Used for dev testing of the stream resolver).
*   **Version Check**: `https://orangegas.store/playervertion.php` (Used to verify/spoof app version).
*   **Pricing**: `https://orangegas.store/pricing12.php` (Subscription package details).

### Content Delivery Network (`somapi.store`)
*   **Stream CDN**: `https://somapi.store/movies/m3u8/...`
*   This CDN hosts direct HLS streams that do not include the "Account Expired" or "Download Suu Player" overlays found on the main GovixTV site.

---

## 3. Vulnerabilities Discovered

### Broken Object Level Authorization (BOLA)
The `/api/series-videos/{id}` endpoint is completely unprotected. By iterating through numeric IDs, an attacker can scrape the entire library of series and their direct `.m3u8` links without needing a valid user session, provided the `ppkey` is present in the headers.

### Data Extraction via ADB (`allowBackup="true"`)
The `AndroidManifest.xml` has `allowBackup` set to `true`. This allows an attacker with physical access to a device to extract the app's internal database (`UserSession.xml`) using `adb backup`, revealing the user's phone number, account ID, and subscription expiry date.

### Identification & Push Leak
The **OneSignal App ID** (`18535b84-230f-440a-b350-fe2ab4836a24`) is hardcoded. While discovery of the App ID alone doesn't grant control, it exposes the notification service provider and allows for targeted interactions if combined with other leaks.

---

## 4. Security Controls implemented by the Developer
*   **VPN Blocker**: The class `com.soodag.lives.VpnBlocker` scans for active `TRANSPORT_VPN` network capabilities. If detected, the app shows a blocking dialog to prevent region-bypass.
*   **Root Detection**: Subtle checks are present to verify if the device is rooted before allowing certain payment operations.

---

## 5. Implementation in Vega
To bypass GovixTV restrictions permanently, the Vega provider now:
1.  Intercepts discovery requests and redirects them to the `test.xaliye4.online` API.
2.  Injects the `ppkey: Hg4fPewbcGfBTskQQE5mktC2vgEHT9GX` header into all metadata and stream requests.
3.  Mimics the Suu Player User-Agent: `SoodagLives/1.1`.
4.  Extracts direct `somapi.store` links for unrestricted playback.
