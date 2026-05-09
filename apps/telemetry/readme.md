### Fake telemetry service

Pure Bun/TypeScript simulator for car telemetry. One process or container represents one car.

Runtime flow:

1. The simulator starts with `CAR_ID`.
2. Without an active trip it sends idle position updates every `IDLE_TELEMETRY_INTERVAL_SEC`.
3. With an active trip it sends telemetry points every `ACTIVE_TELEMETRY_INTERVAL_SEC`.
4. If `ROUTING_URL` is configured, it requests OSRM-compatible routes and drives along returned GeoJSON geometry.
5. If routing is unavailable, it falls back to a generated route inside the configured bounding box.

OSRM route requests use:

```text
/route/v1/{profile}/{lon1},{lat1};{lon2},{lat2}?overview=full&geometries=geojson
```

The simulator is written in an OOP style:

- `BackendClient` sends data to the backend.
- `OsrmRouteProvider` builds map-based routes.
- `FallbackRouteProvider` keeps the car moving without a map service.
- `RouteCursor` advances along route geometry.
- `DrivingModel` simulates speed, acceleration, fuel usage, and occasional speeding.
- `TelemetrySimulator` owns the idle/active loop.

#### Run

Local development without Docker:

```bash
BACKEND_URL=http://localhost:3000 \
CAR_ID=00000000-0000-0000-0000-000000000000 \
TELEMETRY_DEVICE_KEY=dev-telemetry-key \
ROUTING_URL=http://localhost:5000 \
bun run start
```

If `ROUTING_URL` is empty, the simulator uses fallback movement inside the configured bounding box.

#### Config

```env
BACKEND_URL=http://backend:3000
CAR_ID=...
TELEMETRY_DEVICE_KEY=dev-telemetry-key

ROUTING_URL=http://osrm:5000
ROUTING_PROFILE=driving

IDLE_TELEMETRY_INTERVAL_SEC=60
ACTIVE_TELEMETRY_INTERVAL_SEC=10
TRIP_POLL_INTERVAL_SEC=5

INITIAL_LAT=46.3497
INITIAL_LON=48.0408
ROUTE_MIN_LAT=46.31
ROUTE_MIN_LON=47.97
ROUTE_MAX_LAT=46.39
ROUTE_MAX_LON=48.12
ROUTE_SEED=101
DESTINATION_REFRESH_METERS=140

INITIAL_FUEL_LEVEL=80
MIN_SPEED_KMH=12
MAX_SPEED_KMH=54
SPEEDING_CHANCE=0.08
TELEMETRY_SOURCE=fake-car-bun
```

#### Binary

```bash
pnpm -F @carsharing/telemetry run build:bin
```

The output goes to `apps/telemetry/dist/telemetry-simulator`.

#### Docker idea

Before running Docker scenarios:

1. Start backend.
2. Set the same `TELEMETRY_DEVICE_KEY` in backend and telemetry.
3. Create cars in backend and copy their ids.
4. Optional: start OSRM and set `ROUTING_URL`.

Backend on host machine, telemetry in Docker:

```env
BACKEND_URL=http://host.docker.internal:3000
```

Backend in the same Docker network:

```env
BACKEND_URL=http://backend:3000
```

OSRM on host machine:

```env
ROUTING_URL=http://host.docker.internal:5000
```

OSRM in the same Docker network:

```env
ROUTING_URL=http://osrm:5000
```

If OSRM is not running:

```env
ROUTING_URL=
```

The car still moves in fallback mode.

##### Three demo cars

Copy `.env.example` to `.env`, set real car ids from the backend, then start 2-3 simulated cars:

```bash
docker compose --env-file .env -f docker-compose.telemetry.yml up --build
```

Default spawn area is around `54.3282, 48.3866`. The bundled compose file starts three cars with small coordinate offsets and separate route seeds.

Stop them:

```bash
docker compose --env-file .env -f docker-compose.telemetry.yml down
```

Watch logs:

```bash
docker compose --env-file .env -f docker-compose.telemetry.yml logs -f
```

##### Add one car interactively

To add one car while the demo is already running:

```powershell
pnpm -F @carsharing/telemetry run start:car
```

The script asks for `CAR_ID`, backend URL, telemetry key, optional routing URL, and initial coordinates, then starts a dedicated Docker container for that car.

Linux/macOS shell:

```bash
pnpm -F @carsharing/telemetry run start:car:sh
```

##### Add one car on a server

Non-interactive server mode reads env and starts a container:

```bash
CAR_ID=... \
BACKEND_URL=http://backend:3000 \
TELEMETRY_DEVICE_KEY=dev-telemetry-key \
INITIAL_LAT=54.3282 \
INITIAL_LON=48.3866 \
NO_BUILD=1 \
pnpm -F @carsharing/telemetry run start:car:sh:auto
```

Windows non-interactive mode:

```powershell
$env:CAR_ID = "..."
$env:BACKEND_URL = "http://backend:3000"
$env:TELEMETRY_DEVICE_KEY = "dev-telemetry-key"
$env:INITIAL_LAT = "54.3282"
$env:INITIAL_LON = "48.3866"
$env:NO_BUILD = "1"
pnpm -F @carsharing/telemetry run start:car:win:auto
```

Set `REPLACE_EXISTING=1` if a container with the same car id should be replaced.

##### Use a prebuilt image

Build once:

```bash
docker build -t carsharing-telemetry:local apps/telemetry
```

Then start dynamic cars without rebuilding:

```bash
NO_BUILD=1 CAR_ID=... pnpm -F @carsharing/telemetry run start:car:sh:auto
```

```yaml
telemetry-car-1:
  build: ./apps/telemetry
  environment:
    BACKEND_URL: http://backend:3000
    ROUTING_URL: http://osrm:5000
    CAR_ID: ${CAR_1_ID}
    TELEMETRY_DEVICE_KEY: ${TELEMETRY_DEVICE_KEY}
    IDLE_TELEMETRY_INTERVAL_SEC: 60
    ACTIVE_TELEMETRY_INTERVAL_SEC: 10
```
### симуляция телеметрии для каршеринга
