# BharatPlay Admin Panel

The admin panel is a React single-page application built with Vite. Its route
screens are lazy-loaded, while shared UI, authentication, and API services live
in dedicated source folders.

## Source layout

```text
src/
  admin/
    category-management/
    pages/
      auth/
      copyright/
      long-video/
      read-only-dashboard/
      shorts-video/
      support/
    users/
  api/                   Shared Axios client and admin API functions
  app/                   Application router and Redux store
  components/            Shared layout and reusable UI
  config/                Role and route configuration
  context/               Shared React providers
  finance-admin/
    api/
    auth/
    components/
    context/
    pages/
  hooks/                 Shared data and notification hooks
  redux/slices/          Redux feature reducers
  utils/                 Session, formatting, and table helpers
  assets/                Imported static assets
  main.jsx               Browser entry point
public/                  Public files copied as-is by Vite
```

Use the `@/` alias for imports from `src` and keep route screens lazy-loaded.
Place code with a single domain in that domain's folder; keep `components/`,
`hooks/`, and `utils/` for code that is genuinely shared.

## Local development

```sh
npm ci
npm run dev
```

Copy `.env.example` to `.env` and set `VITE_API_BASE_URL` to the backend API
origin, including `/api`. Vite embeds `VITE_` values into the client bundle;
they are public configuration and must not contain secrets.

## Checks and production

```sh
npm run lint
npm run build
```

The production Docker image builds the SPA and serves it with Nginx, including
history fallback for client-side routes and caching for hashed assets:

```sh
docker build --build-arg VITE_API_BASE_URL=https://your-api-host/api -t bharatplay-admin-panel .
docker run --rm -p 8080:8080 bharatplay-admin-panel
```
