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

## 4. Other Identified Vulnerabilities

### Lack of Code Obfuscation (Trivial Reverse Engineering)
The developer did not use tools like ProGuard or R8 effectively. 
*   **The Flaw**: All class names (`TokenGenerator`, `UserManager`, `VpnBlocker`), method names, and string constants were stored in plaintext.
*   **Implication**: This made finding the `ppkey` and internal APIs trivial.

### Client-Side Validation Bypass (Payment Logic)
The app’s payment system appears to rely on client-reported success status.
*   **The Flaw**: In `PaymentActivity`, the app calls `https://test.xaliye4.online/orders2` to notify the server of a "success" after a transaction.
*   **Risk**: If the server doesn't perform server-to-server verification, an attacker could spoof POST requests to `/orders2` with their phone number to activate a "Pro" subscription for free.

### Persistent CDN Links (No Token Expiry)
The stream URLs from `somapi.store` do not contain any session tokens or expiry parameters.
*   **The Flaw**: `.m3u8` links lack `?token=` or `?expires=` parameters.
*   **Risk**: Once extracted, links remain active indefinitely, allowing for unauthorized redistribution.

### Insecure Local Storage (SharedPreferences)
The app stores user session data in `UserSession.xml` in plaintext.
*   **The Flaw**: Stores `id`, `number`, and `expires_at` (subscription date) without encryption.
*   **Risk**: Combined with `allowBackup="true"`, an attacker can extract, modify the `expires_at` date, and restore it to gain a lifetime subscription.

### Information Disclosure (Server Headers)
The backend servers leak software version information in HTTP headers.
*   **Exposure**: `nginx/1.24.0 (Ubuntu)`, `X-Powered-By: Express`.
*   **Risk**: Simplifies the search for version-specific CVEs for server-level attacks.

### Weak VPN Blocking
The `VpnBlocker` class uses basic Android-level checks that are easily bypassed.
*   **The Flaw**: Does not use sophisticated IP/ISP reputation databases.
*   **Risk**: Easily defeated by custom proxies or simple code modification (smali patching).

---

## 5. Security Controls implemented by the Developer
*   **VPN Blocker**: Class `com.soodag.lives.VpnBlocker` scans for active `TRANSPORT_VPN` flags.
*   **Root Detection**: Subtle checks present to verify if the device is rooted before payment operations.

---

## 6. Implementation in Vega
To bypass GovixTV restrictions permanently, the Vega provider now:
1.  Intercepts discovery requests and redirects them to the `test.xaliye4.online` API.
2.  Injects the `ppkey: Hg4fPewbcGfBTskQQE5mktC2vgEHT9GX` header into all requests.
3.  Mimics the Suu Player User-Agent: `SoodagLives/1.1`.
4.  Extracts direct `somapi.store` links for unrestricted playback.

