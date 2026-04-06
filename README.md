# MV App Provider Extensions

MV Providers are dynamic extensions for the MV App. Each provider can be independently updated and tested.

## Project Structure
- `providers/`: Contains specific provider implementations (e.g., `govixtv/`).
- `dist/`: Contains bundled provider code after running the build.
- `manifest.json`: Stores metadata for all providers.
- `build-bundled.js`: Main build script using esbuild and terser.
- `vercel.json`: Configuration for deployment on Vercel with CORS support.

## How to use
Run `npm run build` to build all providers, then host the `dist/` and `manifest.json` on Vercel or any static file hosting.
Add your URL as a "Provider Source" in the MV App to use your custom providers.

## Available Providers
- GovixTV
- VegaMovies (Renamed to MVMovies?)
- MultiStream
- etc.
