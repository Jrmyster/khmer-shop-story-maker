# Deployment

## Cloudflare Pages (Git integration)

1. Connect the new GitHub repository to a Cloudflare Pages project.
2. Production branch: `main`; framework: Vite; build command: `npm run build`;
   build output: `dist`; Node version: 22.12 or newer (set `NODE_VERSION=22`).
3. Core features need no secret or backend. Optional public build settings are
   documented in `.env.example`. Set `VITE_APP_URL` to the actual HTTPS app URL
   after the first deployment; do not invent a hostname in a portal card.
4. Cloudflare Pages uses `public/_headers` copied to `dist`. Its default SPA
   fallback works without `_redirects` when no top-level `404.html` is present.
   Keep `sw.js` non-cacheable and hashed `/assets/` immutable.
5. Visit once online, wait for complete cache installation, close/reopen the app
   and verify offline access and saved-draft recovery on an Android phone.

## Direct upload

Run `npm ci && npm run build`, then upload the **contents** of `dist` in the
Cloudflare Pages dashboard. `index.html` must be at the root. Alternatively,
with Wrangler authenticated to the correct account:

```sh
npx wrangler pages deploy dist --project-name=khmer-shop-story-maker
```

This command is documented, not automatically authenticated. Deployment
credentials must be supplied through the owner's Cloudflare login/CI secrets,
never committed. Do not put a Cloudflare API token in a VITE variable.

## Cloudflare Workers Static Assets

The committed `wrangler.json` uploads `./dist` as static assets and uses
`assets.not_found_handling = "single-page-application"` for navigation to
unmatched paths. No executable Worker or Vite Cloudflare plugin is required
for the default local-first editor. Workers Static Assets applies the existing
`_headers` rules, including security headers and service-worker cache control.

For the Cloudflare **Workers Builds** Git integration use:

| Setting        | Value                             |
| -------------- | --------------------------------- |
| Repository     | `Jrmyster/khmer-shop-story-maker` |
| Branch         | `main`                            |
| Root directory | Repository root                   |
| Worker name    | `khmer-shop-story-maker`          |
| Build command  | `npm run build`                   |
| Deploy command | `npm run deploy:cloudflare`       |

The deploy script pins Wrangler and uploads the already-built assets. It does
not run the build again. Locally, after authentication to the intended account:

```sh
npm ci
npm run build
npm run deploy:cloudflare:check
npm run deploy:cloudflare
```

### Fix for Cloudflare error 100324

The previous `public/_redirects` contained `/* /index.html 200`. Workers rejects
that catch-all rule with "Infinite loop detected" because HTML canonicalization
can strip `/index.html` to `/` and trigger the same rule again. Use the native
SPA fallback in `wrangler.json` instead. Do not restore the catch-all rewrite.

The fixed source must be built into a fresh `dist` folder; Vite clears its
previous output on build. If the dashboard is retrying an older commit, start a
build of the latest `main` commit instead. Asset upload success alone does not
mean a Worker version was successfully deployed.

After deployment, check `/` and an unmatched navigation path, verify the
security/cache headers, and test saved-draft recovery offline. Build and dry-run
success do not replace this live check.

## Hosting scope and installation

This build expects its own origin root. The manifest `scope` and `start_url`,
font URLs and service-worker registration are `/`. A shared-origin subpath
requires changing all of them together. Never set a service-worker scope over
other Khmer One apps. HTTPS is required for camera/microphone and PWA features.

## Enable optional services

Only after a secure owner-operated proxy is ready, set the appropriate HTTPS
VITE proxy URL, allow its exact origin in CSP `connect-src`, and rebuild.
Provider keys are backend secrets. See PROVIDERS.md for payloads, consent,
retention requirements and anti-abuse controls.

## Portal card

`src/data/portal.ts` supplies typed metadata using `VITE_APP_URL` (null until
known). `integration/khmerone-registry.ts` matches the inspected Khmer One
AppEntry schema. Copy it into that repo's `data/`, then append
`shopStoryEntry(verifiedDeploymentUrl)` to its apps array. The existing card
component must retain `target="_blank" rel="noopener noreferrer"`. Do not
publish a clickable card with a guessed URL. A null URL can represent an
explicit not-yet-deployed card. The integration uses the existing `enterprise`
icon so unrelated icon components need no change.
