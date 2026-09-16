# Denise · 42

Static birthday experience published by the existing GitHub Pages configuration at `/denise/`.

- `index.html`: greeting and accessible controls.
- `style.css`: responsive layout.
- `app.js`: Three.js temple explosion, five illustrative NFC cards, fireworks, pause and replay.
- `assets/temple.glb`: original temple geometry from the four printable assemblies, converted from millimetres/Z-up to browser Y-up. Mesh prefixes 01–04 drive the explosion.
- `assets/temple-fallback.png`: static view if WebGL is unavailable.
- `vendor/`: self-hosted Three.js 0.180.0 and its MIT license. No third-party runtime requests, analytics, API keys or build step.

Song cards are illustrations labelled SONG 01–05; no real track names or music URLs were supplied. The physical NFC tags hold the songs separately.

Run a static HTTP server at the repository root and open `/denise/`. Reduced-motion preferences are respected. Drag the gift to rotate it; the text button also supports keyboard activation.
