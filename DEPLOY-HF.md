# Deploy the Maps Extractor to Hugging Face Spaces (free, always-on)

This hosts the self-hosted Maps Extractor (Playwright + Chromium) on a **free**
Hugging Face Space so anyone can reach it from any device — no more depending on
your laptop being awake (the old Tailscale `*.ts.net` tunnel).

Why HF Spaces and not Vercel/Render:
- Vercel can't run headless Chromium (serverless) — that's why this was self-hosted.
- HF free CPU tier gives **16 GB RAM / 2 vCPU**, enough for Chromium, and keeps the
  container running while background scrape jobs execute.
- Render's free tier is only 512 MB RAM (Chromium OOMs) and spins down after 15 min.

The existing `Dockerfile` already works as-is. The only HF-specific bit is the
frontmatter at the top of `README.md` (`sdk: docker`, `app_port: 3000`), which
lives only on this `hf-space` branch.

---

## One-time setup

### 1. Create a free Hugging Face account
https://huggingface.co/join

### 2. Create the Space
https://huggingface.co/new-space
- **Space name:** `maps-extractor` (or anything)
- **License:** your choice
- **SDK:** **Docker** → **Blank** template
- **Hardware:** **CPU basic — free**
- **Visibility:** **Public**  *(required so others can open the URL; your source
  becomes visible, but all secrets stay in HF's encrypted Secrets — never in git)*

Your Space URL will be: `https://huggingface.co/spaces/<username>/maps-extractor`
Your app URL will be:    `https://<username>-maps-extractor.hf.space`

### 3. Create a write token (used as your git password)
https://huggingface.co/settings/tokens → **New token** → role **Write** → copy it.

### 4. Push this branch to the Space
From the repo root (`c:\Users\Leslieyuan988\invoice-app`):

```bash
git remote add hf https://huggingface.co/spaces/<username>/maps-extractor
git push hf hf-space:main
```
When prompted: username = your HF username, password = the **write token** from step 3.
(HF Spaces always build from their `main` branch, so we push `hf-space:main`.)

### 5. Set the Space Secrets
In the Space → **Settings** → **Variables and secrets** → **New secret**, add
each of these. Copy the **values** from your existing self-hosted `.env`
(the one you used for the Tailscale Docker setup):

| Name | Value |
|------|-------|
| `DATABASE_URL` | Neon **direct** endpoint (no `-pooler`) with `?sslmode=require` — same as your `.env` |
| `NEXTAUTH_SECRET` | same as your `.env` (any value works; credential login checks the bcrypt hash in the shared DB) |
| `NEXTAUTH_URL` | `https://<username>-maps-extractor.hf.space` |
| `NEXT_PUBLIC_APP_URL` | `https://<username>-maps-extractor.hf.space` |
| `MAPS_ONLY` | `true` |

Optional (only if you also want the Instagram scraper / proxy / concurrency knobs):
`APIFY_TOKEN`, `BRIGHTDATA_TOKEN`, `MAPS_MAX_CONCURRENCY`, `MAPS_MAX_PER_USER`,
`MAPS_PROXY_SERVER`, `MAPS_PROXY_USERNAME`, `MAPS_PROXY_PASSWORD`.

After adding secrets, the Space rebuilds automatically. First build takes
~5–10 min (it builds the Playwright image). Watch the **Logs** tab.

### 6. Point the main Vercel app at the new URL
So the "Maps Extractor" sidebar link on your Vercel app opens the HF Space:
```bash
vercel env rm MAPS_EXTRACTOR_URL production
vercel env add MAPS_EXTRACTOR_URL production
# paste: https://<username>-maps-extractor.hf.space
vercel --prod   # redeploy so the new env takes effect
```

---

## Updating later
Make changes on `master`, then merge into `hf-space` and push:
```bash
git switch hf-space
git merge master
git push hf hf-space:main
```
The Space rebuilds on every push to `main`.

## Things to know
- **Login:** only **email/password** users work here. Google-OAuth signups can't
  log in unless you add `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` as secrets *and*
  register `https://<username>-maps-extractor.hf.space/api/auth/callback/google`
  as an authorized redirect URI in Google Cloud Console.
- **Sleep:** a free Space sleeps after ~48 h with zero traffic and wakes on the
  next visit (a few seconds). It does **not** sleep mid-scrape while someone is
  polling a running job.
- **Shared database:** the Space uses the same Neon DB as the Vercel app, so
  users/accounts are shared. Vercel still owns schema migrations.
- **Chromium:** already launches with `--no-sandbox --disable-dev-shm-usage`, so
  HF's default 64 MB `/dev/shm` won't crash it (no `shm_size` needed).
