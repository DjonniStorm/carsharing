#!/usr/bin/env sh
set -eu

prompt_default() {
  label="$1"
  default="$2"
  printf "%s [%s]: " "$label" "$default" >&2
  read -r value
  if [ -z "$value" ]; then
    printf "%s" "$default"
  else
    printf "%s" "$value"
  fi
}

prompt_required() {
  label="$1"
  current="$2"
  if [ -n "$current" ]; then
    printf "%s" "$current"
    return
  fi

  while :; do
    printf "%s: " "$label" >&2
    read -r value
    if [ -n "$value" ]; then
      printf "%s" "$value"
      return
    fi
    printf "Value is required.\n" >&2
  done
}

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
TELEMETRY_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
IMAGE_NAME="${TELEMETRY_IMAGE:-carsharing-telemetry:local}"

CAR_ID=$(prompt_required "CAR_ID" "${CAR_ID:-}")
BACKEND_URL=$(prompt_default "BACKEND_URL" "${BACKEND_URL:-http://host.docker.internal:3000}")
TELEMETRY_DEVICE_KEY=$(prompt_default "TELEMETRY_DEVICE_KEY" "${TELEMETRY_DEVICE_KEY:-dev-telemetry-key}")
ROUTING_URL=$(prompt_default "ROUTING_URL, empty for fallback" "${ROUTING_URL:-}")
INITIAL_LAT=$(prompt_default "INITIAL_LAT" "${INITIAL_LAT:-54.3282}")
INITIAL_LON=$(prompt_default "INITIAL_LON" "${INITIAL_LON:-48.3866}")
ROUTE_MIN_LAT=$(prompt_default "ROUTE_MIN_LAT" "${ROUTE_MIN_LAT:-54.27}")
ROUTE_MIN_LON=$(prompt_default "ROUTE_MIN_LON" "${ROUTE_MIN_LON:-48.28}")
ROUTE_MAX_LAT=$(prompt_default "ROUTE_MAX_LAT" "${ROUTE_MAX_LAT:-54.39}")
ROUTE_MAX_LON=$(prompt_default "ROUTE_MAX_LON" "${ROUTE_MAX_LON:-48.50}")

SAFE_CAR_ID=$(printf "%s" "$CAR_ID" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9_.-]/-/g')
CONTAINER_NAME="telemetry-car-$SAFE_CAR_ID"

if [ "${NO_BUILD:-0}" != "1" ]; then
  docker build -t "$IMAGE_NAME" "$TELEMETRY_ROOT"
fi

if [ "$(docker ps -a --filter "name=^/$CONTAINER_NAME$" --format "{{.Names}}")" = "$CONTAINER_NAME" ]; then
  replace=$(prompt_default "Container $CONTAINER_NAME already exists. Replace it? y/N" "N")
  case "$replace" in
    y|Y|yes|YES) docker rm -f "$CONTAINER_NAME" >/dev/null ;;
    *) printf "Cancelled.\n" >&2; exit 0 ;;
  esac
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

if [ -n "$ROUTING_URL" ]; then
  set -- "$@" -e "ROUTING_URL=$ROUTING_URL"
fi

docker "$@" "$IMAGE_NAME"

printf "Started %s\n" "$CONTAINER_NAME"
printf "Logs: docker logs -f %s\n" "$CONTAINER_NAME"
