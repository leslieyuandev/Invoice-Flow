# Single base across all stages: the official Playwright image (pinned to the
# installed playwright version) ships Node.js + Chromium + every system library
# the browser needs, and is glibc-based so Prisma's query-engine binary matches.
# Keep this tag in sync with the `playwright` version in package.json.
FROM mcr.microsoft.com/playwright:v1.60.0-jammy AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# ─── Stage 1: Dependencies ───────────────────────────────────────────────────
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci

# ─── Stage 2: Builder ────────────────────────────────────────────────────────
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Prisma 7's config (prisma.config.ts) throws if DATABASE_URL is unset, even for
# `generate`/`build` which never connect. A placeholder satisfies it at build time;
# the real value is injected at runtime by docker-compose / the host environment.
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"

RUN npx prisma generate
RUN npm run build

# ─── Stage 3: Runner (production image) ──────────────────────────────────────
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

# Guarantee the Chromium build matching our Playwright version is installed for
# this image (system deps already come from the Playwright base image).
RUN npx playwright install chromium

EXPOSE 3000

# Apply any pending migrations, then start the single Next.js app (all modules,
# including the Maps Extractor, run in this one process).
CMD ["npm", "run", "start"]
