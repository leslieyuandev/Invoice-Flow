# Deploying (self-hosted, single app)

This is **one** Next.js app. Every module — invoices, quotations, proposals, Canva,
and the **Maps Extractor** — runs in the same process behind one login and one URL.
There is no separate service or external VPS endpoint.

## Why self-host instead of Vercel

The Maps Extractor drives a real headless **Chromium** (Playwright). Vercel's
serverless functions can't launch a browser, so to run *everything in one place*
the whole app must run on a **Node host** (your own VPS, a droplet, Railway,
Render, a home server, etc.). The other modules run fine here too — nothing is lost.

## Option A — Docker Compose (recommended)

The repo ships a `Dockerfile` (Playwright-ready, Chromium baked in) and a
`docker-compose.yml` with Postgres + the app.

```bash
# 1. Provide secrets (compose reads these from the environment or a .env file)
export NEXTAUTH_SECRET="$(openssl rand -base64 32)"
export NEXTAUTH_URL="https://your-domain"
export NEXT_PUBLIC_APP_URL="https://your-domain"
# (optional) RESEND_API_KEY, RESEND_FROM_EMAIL, GOOGLE_CLIENT_ID/SECRET, STORAGE_*

# 2. Build + start db and app together
docker compose up -d --build

# App: http://<host>:3000   →   Tools → Maps Extractor
```

`prisma migrate deploy` runs automatically on container start, so the schema
(including the maps tables) is applied for you.

> The image is large (~2GB) because it includes Chromium. The app service sets
> `shm_size: "1gb"` so the browser is stable under load.

## Option B — Bare Node host (no Docker)

```bash
npm ci
npx playwright install --with-deps chromium   # browser + Linux system libs
export DATABASE_URL="postgresql://user:pass@host:5432/db"
export NEXTAUTH_SECRET="..."  NEXTAUTH_URL="https://your-domain"
npx prisma migrate deploy
npm run build
npm run start                                  # or run under pm2 / systemd
```

## Required environment variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Postgres connection (compose sets this to the bundled `db`) |
| `NEXTAUTH_SECRET` | Auth session signing — required in production |
| `NEXTAUTH_URL` / `NEXT_PUBLIC_APP_URL` | Your public URL |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | Email sending (optional) |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google login (optional) |
| `STORAGE_*` | Blob/object storage for uploads (optional) |
| `MAPS_MAX_CONCURRENCY` | Max simultaneous scrapes across all users (default `2`) |
| `MAPS_MAX_PER_USER` | Max simultaneous scrapes per user (default `1`) |
| `MAPS_PROXY_SERVER` / `MAPS_PROXY_USERNAME` / `MAPS_PROXY_PASSWORD` | Optional server-wide default proxy used when a run doesn't set its own |
| `MAPS_ONLY` | `true` → this instance exposes **only** the Maps Extractor (other modules redirect to it). Set on the self-hosted instance; leave unset on the main app. |
| `MAPS_EXTRACTOR_URL` | On the main app, makes the sidebar's "Maps Extractor" item link to this external URL (your self-hosted instance). Leave unset on the self-hosted instance. |

## Hybrid setup: main app on Vercel + Maps-only self-hosted, one shared database

Because the Maps Extractor needs a browser (can't run on Vercel), the cleanest split is:

```
  Vercel  (invoice-flow-…vercel.app)         Self-hosted  (your Cloudflare domain)
  ├─ invoices, quotations, creative          └─ Maps Extractor ONLY
  └─ Sidebar "Maps Extractor" ──opens──▶          (MAPS_ONLY=true)
                    │                                   │
                    └──────── same Postgres ────────────┘
                         (one DB = shared users + data)
```

It's **one codebase** with two env configs:

- **Vercel (main app):** set `MAPS_EXTRACTOR_URL=https://<your-maps-domain>/maps-extractor`
  (do **not** set `MAPS_ONLY`). The sidebar shows everything plus a "Maps Extractor"
  item that opens the self-hosted instance in a new tab. Deploy the change by pushing to
  the connected GitHub branch (Vercel auto-builds).
- **Self-hosted (Maps instance):** `MAPS_ONLY=true` (the compose default). The sidebar
  shows only Maps Extractor and every other route redirects to it.

### One shared database (this is the "sync")

Don't run two databases and try to sync them — point **both** deployments at the **same**
Postgres. Then user accounts, clients, and scraped leads are automatically consistent
(no syncing needed). Easiest is a managed Postgres (Neon, Supabase, Vercel Postgres, RDS):

1. Use the **same** `DATABASE_URL` on Vercel and on the self-hosted instance.
   - On self-host with Docker, set `DATABASE_URL` to the managed DB and **stop using the
     bundled `db` service** (start only `app`: `docker compose up -d --build app`).
2. Use the **same** `NEXTAUTH_SECRET` on both so credentials behave identically (users
   still sign in separately on each domain — cookies don't cross domains).
3. Apply the schema (incl. the Maps tables) to that shared DB once:
   `DATABASE_URL=… npx prisma migrate deploy`.

> If you prefer to keep Vercel's existing database, just set the self-hosted
> `DATABASE_URL` to that same connection string and run `prisma migrate deploy` against
> it once to add the Maps tables — that's the whole "account sync."

## Running it for a small team (2–5 users)

The app is already multi-user: every record is scoped per account, so users only see
their own data. For a handful of users one VPS running the Docker stack is plenty —
just mind the scraper, which is the only heavy part.

- **Concurrency is capped.** Only `MAPS_MAX_CONCURRENCY` scrapes (default 2) run at
  once; extra runs wait as **Queued** and start automatically. One user can't launch
  more than `MAPS_MAX_PER_USER` (default 1) at a time. Tune these to your VPS RAM
  (each running scrape uses ~1–2 GB; budget accordingly — 4 GB+ recommended).
- **Restart-safe.** On startup any job left mid-run is marked *failed* (re-runnable),
  so nothing stays stuck "Running" after a deploy/restart.
- **Shared proxy.** Several users scraping Google Maps from one server IP will get
  rate-limited. Set `MAPS_PROXY_*` to a rotating residential proxy so every run routes
  through it by default (users can still override per run).
- **HTTPS + domain.** Put a reverse proxy with automatic TLS in front, e.g. Caddy:

  ```
  your-domain.com {
      reverse_proxy localhost:3000
  }
  ```
  Then set `NEXTAUTH_URL` / `NEXT_PUBLIC_APP_URL` to `https://your-domain.com`.
- **Back up Postgres** (the compose volume `postgres_data`, or use a managed Postgres)
  and configure `STORAGE_*` object storage so uploaded logos/images persist.

If usage grows to many users with heavy concurrent scraping, graduate the scraper to a
separate worker container with a Redis/BullMQ queue (the in-process queue is per
instance, so it assumes a single app container).

## Access via your own domain (HTTPS)

The stack includes a **Caddy** reverse proxy that obtains and auto-renews a free
Let's Encrypt certificate for your domain. You provide: **(1)** a domain you own and
**(2)** a server with a public IP (any VPS) where this stack runs.

1. **DNS:** add an **A record** for your subdomain (e.g. `app.example.com`) → the
   server's public IP. Open ports **80** and **443** in the firewall.
2. **Env** on the server (e.g. a `.env` file beside `docker-compose.yml`):
   ```
   DOMAIN=app.example.com
   NEXTAUTH_URL=https://app.example.com
   NEXT_PUBLIC_APP_URL=https://app.example.com
   NEXTAUTH_SECRET=...        # openssl rand -base64 32
   ```
3. **Start with the proxy profile:**
   ```
   docker compose --profile proxy up -d --build
   ```
   Caddy fetches the certificate on first request. Visit `https://app.example.com`.

### No VPS? Serve a domain from this machine via Cloudflare Tunnel

Runs from your own PC/server behind NAT — no public IP, no open ports. Cloudflare
terminates HTTPS at its edge and forwards to your app through an outbound-only tunnel.

**Quick test (no account/domain, temporary URL):**
```
cloudflared tunnel --url http://localhost:3000
```
Prints a `https://<random>.trycloudflare.com` URL that works immediately (changes each run).

**Permanent, on your own domain (recommended):**
1. Free **Cloudflare account**, add your domain (let Cloudflare manage its DNS).
2. **Zero Trust → Networks → Tunnels → Create a tunnel** (Cloudflared type). Add a
   **Public Hostname**: your hostname (e.g. `app.example.com`) → Service
   **`http://app:3000`** (the app container name on the compose network).
3. Copy the tunnel **token**, then on this machine:
   ```
   # .env beside docker-compose.yml
   CLOUDFLARE_TUNNEL_TOKEN=eyJ...your token...
   NEXTAUTH_URL=https://app.example.com
   NEXT_PUBLIC_APP_URL=https://app.example.com
   ```
4. Start the app + tunnel together (no Caddy needed in this mode):
   ```
   docker compose --profile tunnel up -d --build
   ```
   The `cloudflared` container connects out to Cloudflare and serves your domain over
   HTTPS, restart-safe. Set the env URLs above so logins/links use the real domain.

> Trade-off: the site is up only while this machine + containers run. If the PC sleeps
> or shuts down, the site goes down — fine for a small team, but a always-on box (or a
> cheap VPS) is steadier if you need 24/7 uptime.

## Maps Extractor notes

- Runs as an in-process background job; the UI polls job status every ~2s.
- Proxy is configured **per run** in the form (rotating residential supported);
  the proxy password is used for that run only and never stored.
- Scraping Google Maps is against Google's ToS — intended for your own authorized
  lead-gen/research. Use a proxy and modest volumes to stay reliable.
- Give the host adequate RAM (Chromium needs ~1–2GB headroom per concurrent run).
