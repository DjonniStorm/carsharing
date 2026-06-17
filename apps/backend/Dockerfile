# Multi-stage образ @carsharing/backend.
# Контекст сборки — корень монорепозитория (см. docker-compose.yml).
# Запуск миграций Prisma и Nest выполняется в финальном CMD.

FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate
WORKDIR /repo

# ---------- install ----------
FROM base AS install

# Workspace-метаданные + package.json всех проектов (нужно pnpm для разрешения workspace-deps)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json     apps/backend/
COPY apps/web/package.json         apps/web/
COPY apps/telemetry/package.json   apps/telemetry/
COPY apps/mobile/package.json      apps/mobile/
COPY packages/notification/package.json packages/notification/
COPY packages/validation/package.json   packages/validation/
COPY packages/types/package.json        packages/types/
COPY packages/utils/package.json        packages/utils/

# Ставим зависимости только для бэкенда и его транзитивов (notification и т.п.)
RUN pnpm install --frozen-lockfile --filter "@carsharing/backend..."

# ---------- build ----------
FROM install AS build

COPY packages packages
COPY apps/backend apps/backend

# Prod: workspace-пакеты notification + validation (без них nest/tsc не соберётся)
RUN pnpm --filter @carsharing/notification build \
 && pnpm --filter @carsharing/validation build \
 && pnpm --filter @carsharing/backend exec prisma generate \
 && pnpm --filter @carsharing/backend build

# ---------- runtime ----------
FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /repo /repo
WORKDIR /repo/apps/backend
EXPOSE 3000
# 1) Накатываем миграции (схема к этому моменту в /repo/apps/backend/prisma)
# 2) Запускаем скомпилированный Nest
CMD ["sh", "-lc", "pnpm prisma migrate deploy && node dist/src/main.js"]
