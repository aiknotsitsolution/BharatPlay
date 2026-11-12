# Bitzo — Microservices Conversion

Ye aapke original `bitzo-server` (ek hi Express app, ek hi MongoDB) ka
microservices version hai. Har service **apne alag process aur alag PORT**
par chalti hai, aur **apne alag MongoDB database** ki owner hai.

## Services & Ports

| Service              | Port | Owns (its own DB)                                 | DB name              |
| -------------------- | ---- | ------------------------------------------------- | -------------------- |
| **gateway**          | 5000 | -                                                 | -                    |
| auth-service         | 5001 | User, RefreshToken, Device, DeviceFingerprint     | `bitzo_auth`         |
| admin-service        | 5002 | Admin (employees)                                 | `bitzo_admin`        |
| video-service        | 5003 | Video, Channel, WatchSession                      | `bitzo_video`        |
| category-service     | 5004 | Category                                          | `bitzo_category`     |
| leaderboard-service  | 5005 | (read-only aggregator, no owned data)             | `bitzo_leaderboard`  |
| notification-service | 5006 | Notification                                      | `bitzo_notification` |
| player-ad-service    | 5007 | AdNetwork, AdFillRate, AdImpression               | `bitzo_playerad`     |
| copyright-service    | 5008 | CopyrightCase, CopyrightStrike                    | `bitzo_copyright`    |
| security-service     | 5009 | FraudEvent, TrustScoreLog, AuditEvent, UserDevice | `bitzo_security`     |

The **gateway** (port 5000) is the single entry point your frontend should
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
   doesn't _own_ the data, the model file's last line binds it to a
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

Create ignored `.env` files for `gateway/` and each directory under
`services/`, and supply the configuration required by that service. Do not
commit these files. Use a local MongoDB or your own development database URIs.
The same `JWT_SECRET` and `REFRESH_TOKEN_SECRET` must be used by all services.

```bash
# Install dependencies for every service.
npm run install:all

# Start everything together.
npm install
npm run dev
```

Or start any single service on its own for development:

```bash
cd services/video-service
npm install
npm run dev   # nodemon-style --watch on port 5003
```

## Production deployment with Docker Compose

The production Compose setup uses an external MongoDB deployment; it does not
start a MongoDB container or publish the individual microservice ports. Provide
these secret files on the server before starting:

- `gateway/.env`
- `services/auth-service/.env`
- `services/admin-service/.env`
- `services/video-service/.env`
- `services/category-service/.env`
- `services/leaderboard-service/.env`
- `services/notification-service/.env`
- `services/player-ad-service/.env`
- `services/copyright-service/.env`
- `services/security-service/.env`

Populate each file from your secret manager with that service's production
configuration. Set each service's `MONGO_URI` and any required `*_DB_URI`
values to the production databases. Use the same strong, newly generated
`JWT_SECRET` and `REFRESH_TOKEN_SECRET` across all services. Set public
website/admin URLs and all provider credentials to their production values.
Set `CORS_ORIGINS` in the deployment environment to the comma-separated,
exact HTTPS origins of the frontend and admin panel (no paths or trailing
slashes); unlisted browser origins are denied.
Never commit environment files; restrict them to the deployment account
(for example, `chmod 600 path/to/.env` on Linux).
For local development, when `CORS_ORIGINS` is unset and `NODE_ENV` is not
`production`, browser origins are reflected to keep local login working.
`CORS_ORIGINS=true` is also accepted only outside production for compatibility
with existing local `.env` files. Production intentionally fails closed if
`CORS_ORIGINS` is missing; the string `true` is not a production wildcard.

Each backend service needs `MONGO_URI`, `JWT_SECRET`, and
`REFRESH_TOKEN_SECRET` (at least 32 characters). The auth, admin, and video
services also require `IMAGEKIT_PUBLIC_KEY`, `IMAGEKIT_PRIVATE_KEY`, and
`IMAGEKIT_URL_ENDPOINT`. Configure these cross-service database URIs where
used:

| Service              | Additional database URI keys                                                                                                      |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| auth-service         | `ADMIN_DB_URI`, `NOTIFICATION_DB_URI`, `SECURITY_DB_URI`, `VIDEO_DB_URI`                                                          |
| admin-service        | `AUTH_DB_URI`, `NOTIFICATION_DB_URI`, `SECURITY_DB_URI`, `VIDEO_DB_URI`, `CATEGORY_DB_URI`, `COPYRIGHT_DB_URI`, `PLAYERAD_DB_URI` |
| video-service        | `ADMIN_DB_URI`, `NOTIFICATION_DB_URI`, `AUTH_DB_URI`, `SECURITY_DB_URI`, `CATEGORY_DB_URI`                                        |
| category-service     | `ADMIN_DB_URI`                                                                                                                    |
| leaderboard-service  | `AUTH_DB_URI`, `VIDEO_DB_URI`                                                                                                     |
| notification-service | `AUTH_DB_URI`, `VIDEO_DB_URI`                                                                                                     |
| player-ad-service    | `AUTH_DB_URI`, `SECURITY_DB_URI`                                                                                                  |
| copyright-service    | `ADMIN_DB_URI`, `NOTIFICATION_DB_URI`, `AUTH_DB_URI`, `VIDEO_DB_URI`, `SECURITY_DB_URI`                                           |
| security-service     | `AUTH_DB_URI`, `COPYRIGHT_DB_URI`                                                                                                 |

Mobile OTP authentication also requires `MSG91_AUTH_KEY`, `MSG91_TEMPLATE_ID`,
and a strong `OTP_HASH_SECRET` in the auth-service deployment environment.
Configure the MSG91 template and Indian DLT registration to match the six-digit
OTP message. Email verification uses the auth service's existing `EMAIL`,
`EMAIL_PASSWORD`, and optional `EMAIL_HOST`/`EMAIL_PORT` SMTP settings. Set
`EMAIL_FROM_NAME` to the verified product name shown to recipients (defaults to
`BharatPlay`). For reliable inbox placement, send from an address/domain
authorized by the SMTP provider and configure its SPF, DKIM, and DMARC DNS
records. A display name or email-template change cannot override missing domain
authentication or poor sender reputation. The auth service logs whether SMTP
accepted the message; this does not guarantee inbox delivery, so monitor
provider delivery/bounce records and spam placement.
Google sign-in requires OAuth client IDs for the clients in use. Configure the
website client as `GOOGLE_CLIENT_ID` (and `VITE_GOOGLE_CLIENT_ID` in the website
build); configure the app's Android/iOS client IDs as
`GOOGLE_ANDROID_CLIENT_ID` and `GOOGLE_IOS_CLIENT_ID`. The auth service accepts
only configured ID-token audiences and requires a verified email.

The website and app request ads through `/v1/player/manifest/:video_id`.
Configure active ad networks with VAST tags containing a playable `MediaFile`;
feed ads are skipped when inventory is unavailable or the VAST response has no
supported video media.

For local frontend development, Compose defaults `CORS_ORIGINS` to the
localhost website/admin origins and `http://${LAN_HOST_IP}:5173`. The LAN host
IP defaults to `192.168.1.20`; set `LAN_HOST_IP` to the development computer's
current LAN address if it changes. For deployment, explicitly set
`CORS_ORIGINS` to the comma-separated HTTPS origins of the deployed frontend
and admin panel; do not use the local default in production.

The gateway is published only on `127.0.0.1:5000`. Put it behind a
TLS-terminating reverse proxy on the host and point the frontend to that HTTPS
domain. Configure the MongoDB provider's network allowlist for the host and
keep database backups enabled.

The auth service trusts two proxy hops by default (the gateway and the
TLS-terminating reverse proxy) when resolving client IPs for registration and
sign-in. If your deployment uses a different number of trusted proxies, set
`TRUST_PROXY_HOPS` to that positive hop count for the auth service; never use
untrusted client-supplied forwarding headers as a substitute.

### Redis, BullMQ, and dashboards

Docker Compose starts an authenticated Redis container on its private network.
Set `REDIS_PASSWORD` in the root `.env` file before starting the stack; Redis
does not publish its port to the host. Compose connects the auth, admin, video,
category, copyright, and notification services to that Redis instance.

Auth/video/copyright enqueue notification jobs in BullMQ. The notification
service worker persists them, retries failures, and sends the realtime event.
The category list is cached for 60 seconds, and write operations invalidate
that cache. Video details, discovery, search, search hints, related-video, and
hashtag statistics results use a 15-minute TTL. Per-user feed personalization
and playback progress are still calculated on each request, and video/channel
writes advance a shared cache version so old catalog entries are skipped.
Outside Compose, set `REDIS_URL` and `REDIS_PASSWORD` in the
relevant service environments; without Redis, the existing direct notification
path and per-process rate limits remain available.

The local dashboards are:

- RedisInsight: `http://localhost:5540` (preconfigured for the Compose Redis).
- BullMQ: `http://localhost:5541/admin/queues` (HTTP Basic Auth; username is
  `BULL_BOARD_USER`, default `admin`, and password is `REDIS_PASSWORD`).
- Website: `http://localhost`; API gateway health: `http://localhost:5000/health`.

The RedisInsight and BullMQ dashboard ports bind to loopback only. The API
remains JWT-based and does not enable server-side sessions.

For website or Android/iOS testing from a device on the local network, keep the
device and development computer on the same network. Allow inbound TCP ports
`5000` and `5173` in the computer's firewall. The website Vite dev server
automatically targets port `5000` on the hostname used to open the website.
Start Compose with the gateway bound to the LAN interfaces:

```powershell
$env:GATEWAY_BIND_ADDRESS = "0.0.0.0"
$env:LAN_HOST_IP = "192.168.1.20"
docker compose up --build -d
```

Start the website with `npm run dev`, then open
`http://192.168.1.20:5173` on the development computer or another device on
the same network. Replace the IP with the development computer's current LAN
address when needed. Unset `GATEWAY_BIND_ADDRESS` when LAN access is not
needed; the default bind is loopback-only. For production app builds, set
`EXPO_PUBLIC_API_BASE_URL` to the deployed HTTPS API origin.

```bash
docker compose config --quiet
docker compose up --build -d
docker compose ps
```

Compose waits for each service's `/health` endpoint before starting the
gateway. Check `docker compose logs -f` if a container does not become healthy.
Only the gateway is reachable from the host; internal services communicate
over Compose's private network.

Previously committed environment files and example templates contained
credential-like values. Removing them from the current tree does not remove
them from Git history: rotate database passwords, JWT/device secrets, mail,
and cloud-provider credentials before deploying, and revoke the old values.

## Frontend changes needed

None, if you point your frontend at the gateway (`http://192.168.1.20:5000`)
instead of the old monolith's URL — every route path is unchanged
(`/api/...`, `/v1/player/...`, `/test-vpn`). If your frontend currently
talks directly to an old monolith URL, change that base URL to
`http://192.168.1.20:5000`.

## Operational notes

- Replace admin-service's secondary-connection reads with real internal
  HTTP APIs on auth-service/video-service for a fully decoupled system.
- Move Socket.IO to a shared pub/sub (Redis adapter) if you scale any of
  auth-service/notification-service/security-service beyond one instance
  each — right now each keeps its own in-process Socket.IO server, so
  real-time events only reach clients connected to that specific instance.
- Configure host-level TLS, firewall rules, monitoring, and tested backup
  restore procedures as part of the deployment.






Redis, BullMQ, and the dashboards are running. All Compose services are healthy.

Website: http://localhost
RedisInsight: http://localhost:5540 — Redis connection preconfigured
Bull Board: http://localhost:5541/admin/queues — username admin by default; password is REDIS_PASSWORD in the root .env
Gateway health: http://localhost:5000/health
Verified the dashboards and health URLs return HTTP 200; Bull Board correctly requires authentication (unauthenticated requests return 401). The focused Redis/BullMQ tests passed: 6 suites, 13 tests. Setup details are in README.md.