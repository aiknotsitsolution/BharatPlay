# BharatPlay Website

The BharatPlay website is a React application built with Vite. Its source is
organized around application setup, product features, reusable UI, and route
screens.

## Project structure

```text
src/
  app/                 App shell, route composition, and Redux store
    routes/
  components/          Reusable UI grouped by domain
    channels/
    common/
    player/
    public/
    shorts/
  config/              API and site configuration
  context/             Theme and reward providers
  features/            Feature state and feature APIs
    notifications/
    profile/
    support/
    upload/
    video-page/
    videos/
  hooks/               Shared React hooks
  pages/               Route screens grouped by product area
    auth/
    legacy-auth/
    public-site/
    Settings/
    Studio/
    upload/
    video/
  utils/               Shared browser, media, and notification helpers
  main.jsx              Browser entry point
public/
  advertising/          Optimized static WebP images
tests/                  Vitest and Testing Library tests
```

Use the `@/` alias for imports from `src`; relative imports are still suitable
for neighboring modules. Keep new state, API calls, and UI close to the feature
that owns them. Put genuinely reusable components and utilities in the shared
folders.

## Local development

Install the locked dependencies and start Vite:

```sh
npm ci
npm run dev
```

Copy `.env.example` to `.env` and set the optional `VITE_` values as needed.
Vite embeds these values in the client bundle, so they must never contain
secrets:

- `VITE_API_BASE_URL` — API origin; leave empty in development to use port 5000.
- `VITE_GOOGLE_CLIENT_ID` — public Google OAuth client ID.
- `VITE_SITE_URL` — canonical public website URL.
- `VITE_GOOGLE_PLAY_URL` — Google Play listing URL.
- `VITE_SUPPORT_EMAIL` and `VITE_UPDATE_EMAIL` — public contact addresses.

## Checks and production build

```sh
npm run lint
npm test
npm run build
```

The build is served by Nginx in the Docker image. Set the same `VITE_` values
as Docker build arguments; they are compiled into the static bundle at build
time. Nginx serves the SPA fallback, proxies API traffic to the `gateway`
service, compresses text responses, and caches hashed build assets separately
from un-hashed public images.
