# Optional provider contract

The app works without any API credentials. Leave both proxy URLs empty to keep
all editing and export local.

## Copy endpoint

Configure `VITE_AI_PROXY_URL` with the HTTPS endpoint of an owner-operated secure
proxy. Request: `POST application/json` with
`{"facts":["merchant's description","merchant's benefit"],"tone":"friendly","language":"km"}`.
Response: `{"order":[0,1]}`. Return each index exactly once. The app uses the
original strings; no model-generated facts enter the story. Short local copy
uses the first fact only. Other styles organize all supplied facts. Merchants
edit Khmer and English separately; no automatic translation is claimed.

## Transcription endpoint

`VITE_TRANSCRIPTION_PROXY_URL`: `POST` raw audio Blob with the browser's MIME
content type; response `{"text":"editable transcript"}` (max 1500 characters).
Maximum recording is 20 seconds / 8 MB. The UI requires explicit consent for
this transmission. Check Khmer transcription manually before export.

## Server responsibilities

Store provider keys as platform secrets, not public build variables. Limit
payload size, validate MIME and facts, enforce exact allowed origins, apply
per-client rate limits and a daily spending cap, and authenticate where needed.
Requests from this MVP omit cookies; same-origin authenticated providers may
need an intentional future auth adapter. Never treat CORS as authentication.
Do not accept permanent public uploads or create public preview links by default.

The shipped static app uploads no temporary data and therefore requires no
R2 bucket or server deletion schedule. If a provider introduces temporary
storage, disclose retention (recommend automatic deletion within one hour),
use randomized private object names and authenticated short-lived access, and
implement deletion before enabling the service. The app currently does not
manage remote deletion: providers must not promise a delete-now UI this MVP
has not implemented.

Update `public/_headers` connect-src with each exact proxy origin when enabling
it. The default CSP deliberately permits only same-origin connections. Adding a
VITE URL alone does not authorize a third-party network request through the CSP.
