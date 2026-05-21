# Автономный образ @carsharing/web (Vite + nginx).
# Контекст сборки — корень монорепозитория (docker-compose.yml в apps/web).
# Prod: @carsharing/validation build перед vite — без dist/ validation `tsc -b` web падает.

FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate
WORKDIR /repo

# ---------- install ----------
FROM base AS install

# pnpm с --frozen-lockfile резолвит lockfile целиком, поэтому нужны package.json
# ВСЕХ workspace-проектов из pnpm-workspace.yaml, даже тех, что web не использует.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json     apps/backend/
COPY apps/web/package.json         apps/web/
COPY apps/telemetry/package.json   apps/telemetry/
COPY apps/mobile/package.json      apps/mobile/
COPY packages/notification/package.json packages/notification/
COPY packages/validation/package.json   packages/validation/
COPY packages/types/package.json        packages/types/
COPY packages/utils/package.json        packages/utils/

RUN pnpm install --frozen-lockfile --filter "@carsharing/web..."

# ---------- build ----------
FROM install AS build

COPY packages/validation packages/validation
COPY apps/web apps/web

ARG VITE_API_BASE_URL
ARG VITE_YANDEX_MAPS_API_KEY=
ARG VITE_OPEN_MANAGER_SELF_REGISTER=false

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_YANDEX_MAPS_API_KEY=$VITE_YANDEX_MAPS_API_KEY \
    VITE_OPEN_MANAGER_SELF_REGISTER=$VITE_OPEN_MANAGER_SELF_REGISTER

RUN pnpm --filter @carsharing/validation run build \
 && pnpm --filter @carsharing/web run build

# ---------- runtime ----------
FROM nginx:1.27-alpine AS runtime

COPY apps/web/deploy/nginx.docker.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/apps/web/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1
