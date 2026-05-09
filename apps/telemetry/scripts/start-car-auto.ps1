$ErrorActionPreference = "Stop"

$script = Join-Path $PSScriptRoot "start-car.ps1"

if ([string]::IsNullOrWhiteSpace($env:CAR_ID)) {
  throw "CAR_ID is required for non-interactive start."
}

$params = @{
  CarId = $env:CAR_ID
  BackendUrl = $env:BACKEND_URL
  TelemetryDeviceKey = $env:TELEMETRY_DEVICE_KEY
  RoutingUrl = $env:ROUTING_URL
  InitialLat = if ($env:INITIAL_LAT) { [double]::Parse($env:INITIAL_LAT, [System.Globalization.CultureInfo]::InvariantCulture) } else { [double]::NaN }
  InitialLon = if ($env:INITIAL_LON) { [double]::Parse($env:INITIAL_LON, [System.Globalization.CultureInfo]::InvariantCulture) } else { [double]::NaN }
}

if ($env:NO_BUILD -eq "1") {
  $params.NoBuild = $true
}

if (
  (docker ps -a --filter "name=^/telemetry-car-$($env:CAR_ID.ToLowerInvariant() -replace '[^a-z0-9_.-]', '-')$" --format "{{.Names}}") -and
  $env:REPLACE_EXISTING -ne "1"
) {
  throw "Container already exists. Set REPLACE_EXISTING=1 to replace it."
}

if ($env:REPLACE_EXISTING -eq "1") {
  $params.ReplaceExisting = $true
}

& $script @params
