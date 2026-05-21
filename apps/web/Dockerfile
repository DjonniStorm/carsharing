# Автономный образ @carsharing/web (Vite + nginx).
# Контекст сборки — корень монорепозитория (docker-compose.yml в apps/web).
# Обязательно собирается workspace-пакет @carsharing/validation — без него `tsc -b` web не проходит.

FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate
WORKDIR /repo

# ---------- install ----------
FROM base AS install

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/
COPY packages/validation/package.json packages/validation/

RUN pnpm install --frozen-lockfile --filter "@carsharing/web..."

# ---------- build ----------
FROM install AS build

COPY packages/validation packages/validation
COPY apps/web apps/web

ARG VITE_API_BASE_URL
ARG VITE_YANDEX_MAPS_API_KEY=

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_YANDEX_MAPS_API_KEY=$VITE_YANDEX_MAPS_API_KEY

RUN pnpm --filter @carsharing/validation run build \
 && pnpm --filter @carsharing/web run build

# ---------- runtime ----------
FROM nginx:1.27-alpine AS runtime

COPY apps/web/deploy/nginx.docker.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/apps/web/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1
