param(
  [string]$CarId,
  [string]$BackendUrl,
  [string]$TelemetryDeviceKey,
  [string]$RoutingUrl,
  [double]$InitialLat = [double]::NaN,
  [double]$InitialLon = [double]::NaN,
  [switch]$NoBuild,
  [switch]$ReplaceExisting
)

$ErrorActionPreference = "Stop"

function Prompt-Default([string]$Label, [string]$Default) {
  $value = Read-Host "$Label [$Default]"
  if ([string]::IsNullOrWhiteSpace($value)) {
    return $Default
  }
  return $value.Trim()
}

function Prompt-Required([string]$Label, [string]$CurrentValue) {
  if (-not [string]::IsNullOrWhiteSpace($CurrentValue)) {
    return $CurrentValue.Trim()
  }

  while ($true) {
    $value = Read-Host $Label
    if (-not [string]::IsNullOrWhiteSpace($value)) {
      return $value.Trim()
    }
    Write-Host "Value is required." -ForegroundColor Yellow
  }
}

function Prompt-Double([string]$Label, [double]$CurrentValue, [double]$Default) {
  if (-not [double]::IsNaN($CurrentValue)) {
    return $CurrentValue
  }

  while ($true) {
    $raw = Prompt-Default $Label ([string]::Format([System.Globalization.CultureInfo]::InvariantCulture, "{0}", $Default))
    $parsed = 0.0
    if ([double]::TryParse($raw, [System.Globalization.NumberStyles]::Float, [System.Globalization.CultureInfo]::InvariantCulture, [ref]$parsed)) {
      return $parsed
    }
    Write-Host "Use a number with dot as decimal separator." -ForegroundColor Yellow
  }
}

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$telemetryRoot = Resolve-Path (Join-Path $scriptRoot "..")
$imageName = "carsharing-telemetry:local"

$CarId = Prompt-Required "CAR_ID" $CarId
$BackendUrl = Prompt-Default "BACKEND_URL" $(if ($BackendUrl) { $BackendUrl } else { "http://host.docker.internal:3000" })
$TelemetryDeviceKey = Prompt-Default "TELEMETRY_DEVICE_KEY" $(if ($TelemetryDeviceKey) { $TelemetryDeviceKey } else { "dev-telemetry-key" })
$RoutingUrl = Prompt-Default "ROUTING_URL, empty for fallback" $(if ($RoutingUrl) { $RoutingUrl } else { "" })
$InitialLat = Prompt-Double "INITIAL_LAT" $InitialLat 54.3282
$InitialLon = Prompt-Double "INITIAL_LON" $InitialLon 48.3866

$routeMinLat = Prompt-Default "ROUTE_MIN_LAT" "54.27"
$routeMinLon = Prompt-Default "ROUTE_MIN_LON" "48.28"
$routeMaxLat = Prompt-Default "ROUTE_MAX_LAT" "54.39"
$routeMaxLon = Prompt-Default "ROUTE_MAX_LON" "48.50"

$safeCarId = $CarId.ToLowerInvariant() -replace "[^a-z0-9_.-]", "-"
$containerName = "telemetry-car-$safeCarId"

if (-not $NoBuild) {
  docker build -t $imageName $telemetryRoot
}

$existing = docker ps -a --filter "name=^/$containerName$" --format "{{.Names}}"
if ($existing -eq $containerName) {
  if (-not $ReplaceExisting) {
    $replace = Prompt-Default "Container $containerName already exists. Replace it? y/N" "N"
    if ($replace -notin @("y", "Y", "yes", "YES")) {
      Write-Host "Cancelled." -ForegroundColor Yellow
      exit 0
    }
  }
  docker rm -f $containerName | Out-Null
}

$dockerArgs = @(
  "run",
  "-d",
  "--name", $containerName,
  "--restart", "unless-stopped",
  "-e", "BACKEND_URL=$BackendUrl",
  "-e", "TELEMETRY_DEVICE_KEY=$TelemetryDeviceKey",
  "-e", "CAR_ID=$CarId",
  "-e", ("INITIAL_LAT=" + $InitialLat.ToString([System.Globalization.CultureInfo]::InvariantCulture)),
  "-e", ("INITIAL_LON=" + $InitialLon.ToString([System.Globalization.CultureInfo]::InvariantCulture)),
  "-e", "ROUTE_MIN_LAT=$routeMinLat",
  "-e", "ROUTE_MIN_LON=$routeMinLon",
  "-e", "ROUTE_MAX_LAT=$routeMaxLat",
  "-e", "ROUTE_MAX_LON=$routeMaxLon",
  "-e", "ROUTING_PROFILE=driving",
  "-e", "IDLE_TELEMETRY_INTERVAL_SEC=10",
  "-e", "ACTIVE_TELEMETRY_INTERVAL_SEC=10",
  "-e", "TRIP_POLL_INTERVAL_SEC=5",
  "-e", "MIN_SPEED_KMH=12",
  "-e", "MAX_SPEED_KMH=54",
  "-e", "SPEEDING_CHANCE=0.08",
  "-e", "DESTINATION_REFRESH_METERS=140",
  "-e", "TELEMETRY_SOURCE=fake-car-bun-dynamic"
)

if (-not [string]::IsNullOrWhiteSpace($RoutingUrl)) {
  $dockerArgs += @("-e", "ROUTING_URL=$RoutingUrl")
}

$dockerArgs += $imageName

docker @dockerArgs

Write-Host "Started $containerName" -ForegroundColor Green
Write-Host "Logs: docker logs -f $containerName"
