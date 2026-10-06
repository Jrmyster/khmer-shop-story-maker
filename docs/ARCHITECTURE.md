# Architecture

## Static application

Vite + React + TypeScript + Tailwind CSS, with Lucide icons. No server, account,
analytics, external font request or rendering library is required. Production
output is `dist/`, deployable at an HTTPS origin root. Core canvas composition
is shared by the preview and the export adapter. Video recording and PNG
export load only after an export action; the service worker precaches this
small chunk so offline exports work after installation.

## Project and media storage

`src/types.ts` defines a versioned project with business facts, caption text,
photo crop settings and Blob references. `src/lib/storage.ts` stores project
records and compressed media together in IndexedDB `khmer-shop-story-maker-v1`.
Writes are serialized and debounced 650 ms. Hidden-tab events trigger another
save attempt. History reopens the latest project on startup. Draft restoration
sanitizes text lengths and clamps image count and rendering controls.

Product photographs are decoded locally, signature-checked, capped at 12 MB,
then resized to at most 1600 pixels on their long edge and JPEG compressed.
KHQR is contained without cropping, losslessly saved as PNG at up to 1400
pixels. The original full-resolution upload is not retained; the uncropped
compressed photo is retained for later crop adjustments. Recordings are limited
to 20 seconds / 8 MB. Temporary Blob URLs are revoked by their owning component.

The local storage guarantee depends on browser quota and browser retention.
Private browsing, clearing site data and operating-system eviction can remove
projects. A visible storage error explains this. There is no cloud backup.

## Renderer

`src/render/canvas.ts` draws a 720 × 1280 design scaled to the chosen output.
Four typed palettes share typography and safe margins. Khmer font files are
self-hosted and explicitly loaded before export. Grapheme-aware wrapping avoids
splitting Khmer combining clusters on supported browsers. Long text is fitted,
then visibly ellipsized if needed; merchants must review the preview.

Photos use cover cropping; logos and QR images use contain. Captions are
editable and distributed across the first 76% of a 10–20 second video. The
remaining 24% is a static order screen. Caption timing is inspectable and
seekable; timing is not automatic speech alignment.

`src/render/export.ts` produces PNG or records a canvas stream at 24 fps using
runtime-selected MediaRecorder codecs. Optional narration is decoded with Web
Audio and mixed into the captured stream. See EXPORT_SPIKE.md for browser
support and testing boundaries. Memory limits, visibility loss, aborts,
recorder errors and a watchdog end failed exports safely. Tracks, the canvas,
AudioContext and animation frames are disposed. An image export remains available.

## Optional providers

`src/providers/index.ts` isolates copy, transcription and payment interfaces.
Default copy is a deterministic arrangement of verbatim merchant facts. AI
may return only an index permutation of these facts: unknown additions are
rejected. It cannot change prices, contacts, benefits or discounts. This MVP
does not offer automatic translation or unconstrained copy generation.

Remote services are inactive unless HTTPS proxy URLs are configured. An explicit
consent dialog precedes transmission. Text-only requests contain description,
benefit, tone and output-language preference. Transcription sends only the
chosen recording. No product photograph, logo or KHQR is transmitted. Provider
secrets belong on the owner's server, never in VITE variables. Providers must
supply authentication/abuse controls and document their retention policy.

## Offline

The build script hashes and precaches every required static shell file,
including fonts and the lazy export chunk. Cache names begin `shop-story-shell-`.
Fetch handling is restricted to same-origin GETs inside the service-worker
scope; other apps, optional APIs and user media are not added to Cache Storage.
Navigation falls back to the precached index when offline. Updates wait for a
clean visit rather than replacing an in-progress editor. Saved projects remain
in IndexedDB when shell caches update. The manifest is configured for its own
origin root, not a subpath on a shared origin.

## Payment and premium flags

Watermark-free exports, template packs and public links are all false by default.
`PaymentVerifier` is independent from the UI. Its disabled implementation always
returns `verified: false`. KHQR upload never calls it. A future legitimate
payment integration must verify transactions on a trusted server before issuing
scoped export entitlements. Uploaded screenshots are not verification.
