#!/usr/bin/env sh
set -eu

if [ -z "${CAR_ID:-}" ]; then
  echo "CAR_ID is required for non-interactive start." >&2
  exit 1
fi

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
TELEMETRY_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
IMAGE_NAME="${TELEMETRY_IMAGE:-carsharing-telemetry:local}"

BACKEND_URL="${BACKEND_URL:-http://host.docker.internal:3000}"
TELEMETRY_DEVICE_KEY="${TELEMETRY_DEVICE_KEY:-dev-telemetry-key}"
INITIAL_LAT="${INITIAL_LAT:-54.3282}"
INITIAL_LON="${INITIAL_LON:-48.3866}"
ROUTE_MIN_LAT="${ROUTE_MIN_LAT:-54.27}"
ROUTE_MIN_LON="${ROUTE_MIN_LON:-48.28}"
ROUTE_MAX_LAT="${ROUTE_MAX_LAT:-54.39}"
ROUTE_MAX_LON="${ROUTE_MAX_LON:-48.50}"

SAFE_CAR_ID=$(printf "%s" "$CAR_ID" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9_.-]/-/g')
CONTAINER_NAME="telemetry-car-$SAFE_CAR_ID"

if [ "${NO_BUILD:-0}" != "1" ]; then
  docker build -t "$IMAGE_NAME" "$TELEMETRY_ROOT"
fi

if [ "$(docker ps -a --filter "name=^/$CONTAINER_NAME$" --format "{{.Names}}")" = "$CONTAINER_NAME" ]; then
  if [ "${REPLACE_EXISTING:-0}" != "1" ]; then
    echo "Container $CONTAINER_NAME already exists. Set REPLACE_EXISTING=1 to replace it." >&2
    exit 1
  fi
  docker rm -f "$CONTAINER_NAME" >/dev/null
fi

set -- \
  run -d \
  --name "$CONTAINER_NAME" \
  --restart unless-stopped \
  -e "BACKEND_URL=$BACKEND_URL" \
  -e "TELEMETRY_DEVICE_KEY=$TELEMETRY_DEVICE_KEY" \
  -e "CAR_ID=$CAR_ID" \
  -e "INITIAL_LAT=$INITIAL_LAT" \
  -e "INITIAL_LON=$INITIAL_LON" \
  -e "ROUTE_MIN_LAT=$ROUTE_MIN_LAT" \
  -e "ROUTE_MIN_LON=$ROUTE_MIN_LON" \
  -e "ROUTE_MAX_LAT=$ROUTE_MAX_LAT" \
  -e "ROUTE_MAX_LON=$ROUTE_MAX_LON" \
  -e "ROUTING_PROFILE=${ROUTING_PROFILE:-driving}" \
  -e "IDLE_TELEMETRY_INTERVAL_SEC=${IDLE_TELEMETRY_INTERVAL_SEC:-60}" \
  -e "ACTIVE_TELEMETRY_INTERVAL_SEC=${ACTIVE_TELEMETRY_INTERVAL_SEC:-10}" \
  -e "TRIP_POLL_INTERVAL_SEC=${TRIP_POLL_INTERVAL_SEC:-5}" \
  -e "MIN_SPEED_KMH=${MIN_SPEED_KMH:-12}" \
  -e "MAX_SPEED_KMH=${MAX_SPEED_KMH:-54}" \
  -e "SPEEDING_CHANCE=${SPEEDING_CHANCE:-0.08}" \
  -e "DESTINATION_REFRESH_METERS=${DESTINATION_REFRESH_METERS:-140}" \
  -e "TELEMETRY_SOURCE=${TELEMETRY_SOURCE:-fake-car-bun-dynamic}"

if [ -n "${ROUTING_URL:-}" ]; then
  set -- "$@" -e "ROUTING_URL=$ROUTING_URL"
fi

docker "$@" "$IMAGE_NAME"

echo "Started $CONTAINER_NAME"
echo "Logs: docker logs -f $CONTAINER_NAME"
