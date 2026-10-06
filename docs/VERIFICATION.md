# MVP verification record

Verified on 6 October 2026. This record separates automated/browser evidence
from tests still required on real phones and a production HTTPS origin.

## Build and automated checks

| Gate                             | Result                                                                                                      |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| TypeScript (`npm run typecheck`) | Passed                                                                                                      |
| ESLint (`npm run lint`)          | Passed                                                                                                      |
| Vitest (`npm test`)              | 31 tests passed in 10 files                                                                                 |
| Production (`npm run build`)     | Passed; static `dist/index.html` plus assets and generated service worker                                   |
| Translation keys                 | English/Khmer keys and array lengths consistent; bilingual rendering covered                                |
| Project/pricing                  | Manual KHR, USD and dual amounts; invalid prices, versioned recovery, no invented facts                     |
| Media validation                 | JPEG/PNG/WebP type, size/signature rejection and resize calculations                                        |
| IndexedDB                        | Save/reopen photo, voice and KHQR Blobs; delete recovery record                                             |
| Export capabilities              | Missing APIs/codecs, MP4 preference and WebM fallback                                                       |
| Export cleanup                   | Abort cancels capture and releases tracks/canvas; pre-aborted job rejected                                  |
| Voice                            | Permission denial; 20-second limit; recorder, tracks and timer cleanup                                      |
| Accessibility                    | First-step axe scan in jsdom (contrast excluded there); labelled completed steps                            |
| Palette contrast                 | Main text, muted contacts and prices meet 4.5:1 against their defined surfaces                              |
| Service worker                   | VM test runs the generated worker: own cache prefix/scope, offline navigation, no POST/cross-origin caching |

The initial production JS is approximately 84 KB gzipped, CSS 4.9 KB gzipped.
The native video adapter is a separate lazy chunk (about 1.4 KB gzipped), with
no FFmpeg/WASM or heavy rendering package on the landing screen. Two licensed,
self-hosted Khmer font weights are precached for offline text rendering.

## Interactive browser checks

- Entered mixed Khmer/English shop and product names, KHR 6,000 / USD 1.50 and
  a clearly synthetic Telegram contact. Tested one image, then five images.
- Added/reordered local demonstration photos; crop position/zoom controls,
  four template selections and editable bilingual story fields available.
- Visited all seven wizard stages and reviewed transcript/caption controls,
  original-voice/silent choice and visible unavailable-microphone message.
- Uploaded a synthetic non-payment QR test image, removed and replaced it.
  No banking credentials or real merchant KHQR were used or committed.
- Generated a PNG preview and a playable silent MP4. Browser video reported
  **720 × 1280**, readyState 4, no media error and duration about **14.54 s**
  for the 15-second requested timeline. MediaRecorder timing is approximate.
- Cancelled a subsequent export; an interruption message appeared. Refreshed
  and recovered project details, five photos, KHQR and the saved wizard step.
- Checked interface modes EN, KM and KM + EN. At 320 px and 390 px iframe
  widths, no document-level horizontal overflow occurred. Completed step
  buttons have accessible names and measured 44 × 44 px targets; the small
  progress strip itself can scroll horizontally.
- Inspected the explicit portal URL, target and noopener/noreferrer attributes.
- Reviewed desktop and narrow screenshots. Khmer shaping and mixed prices
  rendered; controls wrapped instead of clipping. See [mobile proof](mobile-preview.jpg).

The preview transport was HTTP, so these browser sessions could not exercise
secure-context microphone capture or install the production service worker.
Those paths have automated coverage, not real-browser certification here.
The browser's native-download capture utility timed out: generated media and
valid download links were inspected, but an OS file-save result was not captured.

## Before a broad merchant launch

On a deployed HTTPS origin, test inexpensive Android Chrome and iPhone Safari:

1. Install/reopen online, then in airplane mode; recover the saved draft,
   Khmer fonts and export module. Validate site-data eviction warnings.
2. Allow and deny microphone permission; record, replay, re-record and export
   with narration. Confirm portrait camera upload and file chooser behavior.
3. Download PNG and each supported video format to the device, then import
   them into Facebook Reels, TikTok, Instagram and Telegram. Check recipient
   text and scan-test the merchant's own KHQR after compression.
4. Check a one-photo and five-photo export at 720p; attempt 1080p only with
   sufficient memory. Interrupt by backgrounding and retry without draft loss.
5. Review Khmer translations with a native merchant. Review long captions,
   shop names and ordering details for ellipses, platform UI overlays and readability.
6. Verify Cloudflare security/cache headers, HTTPS, SPA routing and service
   worker root scope. Enable no proxy until its abuse/retention controls exist.

These remaining checks are explicit release gates, not claims already passed.
