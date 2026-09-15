# Bitzo — Microservices Conversion

Ye aapke original `bitzo-server` (ek hi Express app, ek hi MongoDB) ka
microservices version hai. Har service **apne alag process aur alag PORT**
par chalti hai, aur **apne alag MongoDB database** ki owner hai.

## Services & Ports

| Service              | Port | Owns (its own DB)                              | DB name             |
|----------------------|------|-------------------------------------------------|---------------------|
| **gateway**           | 4000 | -                                                | -                   |
| auth-service         | 4001 | User, RefreshToken, Device, DeviceFingerprint   | `bitzo_auth`        |
| admin-service        | 4002 | Admin (employees)                               | `bitzo_admin`       |
| video-service        | 4003 | Video, Channel, WatchSession                    | `bitzo_video`       |
| category-service     | 4004 | Category                                        | `bitzo_category`    |
| leaderboard-service  | 4005 | (read-only aggregator, no owned data)           | `bitzo_leaderboard` |
| notification-service | 4006 | Notification                                    | `bitzo_notification`|
| player-ad-service    | 4007 | AdNetwork, AdFillRate, AdImpression             | `bitzo_playerad`    |
| copyright-service    | 4008 | CopyrightCase, CopyrightStrike                  | `bitzo_copyright`   |
| security-service     | 4009 | FraudEvent, TrustScoreLog, AuditEvent, UserDevice | `bitzo_security`  |

The **gateway** (port 4000) is the single entry point your frontend should
talk to — it proxies every request to the right service, so `/api/...` and
`/v1/player/...` paths work **exactly the same as the old monolith**. See
`gateway/server.js` for the full routing table.

## The one thing you must understand: cross-service data access

The original monolith had ONE shared database, so any controller could
directly query any Mongoose model. Splitting into 9 databases means a lot
of that code needed a real fix, not just a copy-paste:

1. **Foreign models use a secondary connection.**
   Every service's `models/` folder still contains the model files it
   needs (e.g. `admin-service/models/usermodel.js`), but if that service
   doesn't *own* the data, the model file's last line binds it to a
   **secondary connection** to the owning service's database instead of
   the service's own primary connection. This is set up in every
   service's `config/connections.js`. Nothing above the model file
   (controllers, routes) had to change for this part — `require("../models/usermodel")`
   still works the same everywhere.

2. **Mongo `$lookup` and `.populate()` don't work across databases.**
   These only work within a single database. Wherever the original code
   used them to join, say, a Video (video-service) to its uploader
   (auth-service), that had to be rewritten:
   - `$lookup` aggregation stages that crossed a DB boundary were
     replaced with a manual second query + in-memory merge
     (`leaderboard-service/controller/leaderboardController.js` and part
     of `video-service/controller/userVideoController.js` are the two
     places this happened).
   - `.populate("path", "select")` calls that crossed a DB boundary were
     rewritten to `.populate({ path, select, model: TheForeignModel })` —
     passing the actual foreign model object makes Mongoose run it as a
     separate query against the right connection, instead of trying to
     resolve the ref on the parent document's own connection (which would
     throw `MissingSchemaError`). This shows up across `video-service`,
     `admin-service`/`auth-service`'s `AdminController.js`,
     `copyright-service`, and `notification-service`.

3. **Admin-service is intentionally the least "pure" one.**
   The original `AdminController.js` is ~3,500 lines and touches almost
   every domain (users, videos, channels, notifications, fraud events,
   trust scores, audit log) in single requests — a real dashboard/BFF
   pattern. Rewriting every one of those reads into internal HTTP calls
   between services would roughly double this project's size. Instead,
   `admin-service` (and a few similar spots in `video-service` /
   `copyright-service` / `security-service`) reads/writes those other
   databases directly through the secondary-connection pattern above.
   **Write ownership is still correct** (e.g. only auth-service's own
   code path creates Users at signup) — this is a pragmatic trade-off for
   read/administrative access, not a violation of who owns what.
   If you want to fully decouple this later, the pattern is: replace a
   given `require("../models/X")` + secondary connection with an `axios`
   call to that service's own API instead.

## JWT auth is stateless across services

Each service still has its own local copy of `isAuthenticated` /
`requireAdmin` / `tokenService.js`. They verify the JWT signature locally
(same `JWT_SECRET` / `REFRESH_TOKEN_SECRET` must be set in every
service's `.env`) and then do a DB-backed check (e.g. "is this user
suspended/banned?") against auth-service's database through the same
secondary-connection pattern. No service calls auth-service over HTTP
just to validate a token.

## Running locally (no Docker)

```bash
# 1) one-time: create a .env in every service from its .env.example
./setup-env.sh
# now edit each services/*/.env and gateway/.env with real secrets
# (JWT_SECRET, REFRESH_TOKEN_SECRET, IMAGEKIT_*, CLOUDINARY_*, etc.)
# Make sure JWT_SECRET and REFRESH_TOKEN_SECRET are IDENTICAL across all
# services and gateway — they're independent processes but must agree on
# how to verify tokens.

# 2) make sure a local MongoDB is running on localhost:27017
#    (each service will create/use its own database name automatically)

# 3) install dependencies for every service
npm run install:all

# 4) start everything together (needs `concurrently`, installed via root package.json)
npm install
npm run dev
```

Or start any single service on its own for development:
```bash
cd services/video-service
npm install
npm run dev   # nodemon-style --watch on port 4003
```

## Running with Docker

```bash
./setup-env.sh   # create .env files first, then fill in secrets
docker compose up --build
```

This starts one shared `mongo` container plus all 9 services and the
gateway, each in its own container, each pointed at its own database name
on that Mongo server (`bitzo_auth`, `bitzo_video`, ...).

## Frontend changes needed

None, if you point your frontend at the gateway (`http://localhost:4000`)
instead of the old monolith's URL — every route path is unchanged
(`/api/...`, `/v1/player/...`, `/test-vpn`). If your frontend currently
talks to `http://localhost:8000` directly, just change that base URL to
`http://localhost:4000`.

## What's next (optional follow-ups)

- Replace admin-service's secondary-connection reads with real internal
  HTTP APIs on auth-service/video-service for a fully decoupled system.
- Move Socket.IO to a shared pub/sub (Redis adapter) if you scale any of
  auth-service/notification-service/security-service beyond one instance
  each — right now each keeps its own in-process Socket.IO server, so
  real-time events only reach clients connected to that specific instance.
- Add per-service health checks / readiness probes to `docker-compose.yml`
  if you deploy this to k8s or a similar orchestrator later.
