# Mobile video export technical spike

## Decision

Use native Canvas + MediaRecorder + optional Web Audio. Do not ship desktop-only
WebCodecs, a large FFmpeg/WASM download, or a server upload as an essential step.
PNG is the universal export fallback. Runtime capability detection chooses MP4
(H.264) where supported, otherwise WebM (VP8/Opus). Output is decode-checked,
not just assumed to be valid because a MIME query returned true.

## Primary-source compatibility evidence

- [MDN: canvas.captureStream](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/captureStream)
- [MDN: MediaRecorder](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder)
- [MDN: isTypeSupported](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/isTypeSupported_static):
  available resources can still cause recording failure after a positive query.
- [WebKit: MediaRecorder API](https://webkit.org/blog/11353/mediarecorder-api/):
  Safari supports MediaRecorder with MP4 H.264/AAC and streams from Canvas/Web Audio.
- [WebKit: Safari 18.4](https://webkit.org/blog/16574/webkit-features-in-safari-18-4/):
  adds WebM/VP8/VP9/Opus recording, so format must not be inferred from user-agent names.

## Constraints

Export occurs in real time, not faster than the 10–20 second video duration.
Keep the page in the foreground and the screen awake. A hidden tab or explicit
cancel interrupts the recording; a preserved local draft and PNG fallback remain.
720p is the default for inexpensive phones; 1080p is optional. No music or voice
synthesis is bundled. Audio recording and service-worker installation require
HTTPS (localhost is allowed for local development). iOS may download a file
rather than expose a share-sheet option. Social services differ in their WebM
acceptance, so the UI explains when a conversion is needed.

## Verification boundaries

Automated tests cover capability detection, missing codecs, transcript/caption
logic, project recovery and export interruption cleanup. Browser verification
results are recorded in VERIFICATION.md. Physical Android/iPhone hardware
performance and target social-app imports must still be checked before a broad
public release; this implementation does not promise identical codecs or
frame rate on every low-memory device.
