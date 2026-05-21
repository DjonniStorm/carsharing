#!/bin/sh
# Первый выпуск Let's Encrypt для deploy/docker-compose.prod.yml.
# Без этого скрипта proxy не стартует: нет /etc/letsencrypt/live/$DOMAIN/.
# Запуск из корня репо: ./deploy/scripts/init-letsencrypt.sh

set -eu

cd "$(dirname "$0")/../.."

if [ ! -f deploy/.env.prod ]; then
  echo "Создайте deploy/.env.prod из deploy/.env.prod.example"
  exit 1
fi

set -a
# shellcheck disable=SC1091
. deploy/.env.prod
set +a

if [ -z "${DOMAIN:-}" ] || [ -z "${CERTBOT_EMAIL:-}" ]; then
  echo "Задайте DOMAIN и CERTBOT_EMAIL в deploy/.env.prod"
  exit 1
fi

COMPOSE="docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env.prod"
VOLUME_NAME="carsharing-prod_certbot_www"

echo "==> Проверка DNS: ${DOMAIN}..."
if ! getent hosts "$DOMAIN" >/dev/null 2>&1; then
  echo "Предупреждение: не удалось разрешить ${DOMAIN}. Убедитесь, что DuckDNS указывает на IP VPS."
fi

echo "==> Создаём docker network и volume certbot (если ещё нет)..."
docker network inspect carsharing >/dev/null 2>&1 || docker network create carsharing
docker volume create "$VOLUME_NAME" >/dev/null 2>&1 || true

CERT_EXISTS=0
if docker run --rm -v carsharing-prod_certbot_etc:/etc/letsencrypt:ro alpine \
  test -f "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" 2>/dev/null; then
  CERT_EXISTS=1
  echo "==> Сертификат для ${DOMAIN} уже есть — пропускаем certonly."
fi

if [ "$CERT_EXISTS" -eq 0 ]; then
  echo "==> Временный nginx на :80 для ACME (webroot)..."
  docker rm -f carsharing-acme-bootstrap 2>/dev/null || true
  if docker run --rm -d \
    --name carsharing-acme-bootstrap \
    --network carsharing \
    -p 80:80 \
    -v "$(pwd)/deploy/nginx/bootstrap-acme.conf:/etc/nginx/conf.d/default.conf:ro" \
    -v "${VOLUME_NAME}:/var/www/certbot" \
    nginx:1.27-alpine; then
    :
  else
    echo "Ошибка: порт 80 занят или нет прав. Освободите :80 (system nginx, старый proxy)."
    exit 1
  fi

  sleep 2

  echo "==> Запрашиваем сертификат Let's Encrypt для ${DOMAIN}..."
  if ! docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env.prod \
    run --rm --entrypoint certbot certbot certonly \
    --webroot -w /var/www/certbot \
    --email "$CERTBOT_EMAIL" \
    --agree-tos --no-eff-email \
    -d "$DOMAIN"; then
    docker stop carsharing-acme-bootstrap >/dev/null 2>&1 || true
    echo "certbot failed. Проверьте: DuckDNS → IP VPS, порт 80 открыт с интернета, DOMAIN верный."
    exit 1
  fi

  docker stop carsharing-acme-bootstrap >/dev/null 2>&1 || true
fi

echo "==> Поднимаем полный стек (proxy + certbot renew + build)..."
$COMPOSE up -d --build

echo ""
echo "Готово: https://${DOMAIN}/"
echo "Обновление сертификата: сервис certbot (renew). После renew иногда нужно:"
echo "  docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env.prod restart proxy"
