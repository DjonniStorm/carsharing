# Prod-деплой (DuckDNS + HTTPS)

## Один env на VPS

```bash
cp deploy/.env.prod.example deploy/.env.prod
# заполнить SMTP, секреты, пароли, ключ Яндекс.Карт
```

[deploy/.env.prod](.env.prod) используется и для `docker compose --env-file`, и как `env_file` у backend (JWT, SMTP, telemetry, …). Локальная разработка — отдельно [apps/backend/.env.example](../apps/backend/.env.example), на сервер не нужен.

## Что наружу

| Порт | Сервис | Зачем | Открывать в firewall VPS |
|------|--------|-------|---------------------------|
| 80   | edge nginx | redirect → 443 + ACME challenge | да |
| 443  | edge nginx | SPA + API + WebSocket `/trip/` | да |
| 5432 | postgres | DBeaver с ноутбука | да (для демо) |
| 3001 | grafana  | дашборды | да (для демо) |
| 9090 | prometheus | (опционально) | можно не открывать |

UFW-пример:

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80,443/tcp
sudo ufw allow 5432/tcp
sudo ufw allow 3001/tcp
sudo ufw enable
```

## Почта на prod

Регистрация с verify-email работает **только если** в `.env.prod` заполнены `NOTIFICATION_EMAIL_HOST/USER/PASSWORD/FROM` и `AUTH_SKIP_VERIFICATION=false`.

Без SMTP — поставь `AUTH_SKIP_VERIFICATION=true`: JWT сразу после регистрации, письма не шлём.

## Яндекс.Карты

В кабинете developer.tech.yandex.ru у JS API ключа в Referer оставить:

- `https://carsharing-coursework.duckdns.org/*` (или твой DOMAIN)
- `http://localhost:*/*` (для локальной разработки)

Для демо без домена поле Referer можно оставить пустым.

## Telemetry с ноутбука

В `apps/telemetry/.env` (или env при запуске):

```
BACKEND_URL=https://carsharing-coursework.duckdns.org
TELEMETRY_DEVICE_KEY=<такой же, как в deploy/.env.prod>
```

WS-канал телеметрия не открывает — только REST `/telemetry/*`, через edge nginx → backend.

## DBeaver

Хост = IP VPS, порт = `POSTGRES_PUBLISH_PORT` (`5432`), user/password/db — из `POSTGRES_USER/PASSWORD/DB`.

## Первый запуск

```bash
chmod +x deploy/scripts/init-letsencrypt.sh
./deploy/scripts/init-letsencrypt.sh
```

Скрипт сам:

1. Проверяет, что DOMAIN резолвится в IP VPS (DuckDNS должен быть обновлён заранее).
2. Если сертификата ещё нет — поднимает временный nginx на :80, certbot выпускает cert через webroot.
3. Запускает полный стек: `docker compose ... up -d --build` (соберёт backend + web с правильными `VITE_*`).

Без сертификата `proxy` не стартует — он смонтирует пустой `/etc/letsencrypt`.

## Сборка образов

Один `docker build` собирает всё нужное:

- backend: `@carsharing/notification build` → `@carsharing/validation build` → `prisma generate` → `nest build`
- web: `@carsharing/validation build` → `vite build` с `VITE_*` из `--env-file deploy/.env.prod`

При смене `VITE_*` в `.env.prod` нужен `up -d --build`, иначе старый bundle.

## Обновления

```bash
docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env.prod up -d --build
```

## Обновление сертификата

Сервис `certbot` сам делает `certbot renew --quiet` каждые 12 ч. После реального обновления — `restart proxy`, чтобы nginx подхватил новый cert:

```bash
docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env.prod restart proxy
```

## Переменные

Полный список — [`.env.prod.example`](.env.prod.example):

| Группа | Что в ней |
|--------|-----------|
| TLS / домен | `DOMAIN`, `CERTBOT_EMAIL` |
| Web build  | `VITE_API_BASE_URL` (без `/api`), `VITE_YANDEX_MAPS_API_KEY`, `VITE_OPEN_MANAGER_SELF_REGISTER` |
| Auth       | `JWT_SECRET`, `AUTH_TOKEN_SECRET`, `JWT_EXPIRES_IN`, `AUTH_SKIP_VERIFICATION`, `OPEN_MANAGER_SELF_REGISTER` |
| Почта      | `NOTIFICATION_EMAIL_HOST/PORT/SECURE/USER/PASSWORD/FROM` |
| Telemetry  | `TELEMETRY_DEVICE_KEY`, `TELEMETRY_PERIOD_SEC` |
| Violations | `VIOLATION_SPEED_LIMIT_KMH`, `VIOLATION_LOW_FUEL_THRESHOLD`, `VIOLATION_DEDUP_WINDOW_SEC` |
| БД         | `POSTGRES_USER/PASSWORD/DB/PUBLISH_PORT` |
| Monitoring | `GRAFANA_ADMIN_USER/PASSWORD/PUBLISH_PORT`, `GRAFANA_ROOT_URL`, `PROMETHEUS_PUBLISH_PORT` |
