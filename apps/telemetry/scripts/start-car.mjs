import { spawnSync } from 'node:child_process';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const telemetryRoot = path.resolve(scriptDir, '..');
const imageName = process.env.TELEMETRY_IMAGE || 'carsharing-telemetry:local';

const rl = createInterface({ input, output });

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    ...options,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function capture(command, args) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });
  if (result.status !== 0) {
    return '';
  }
  return result.stdout.trim();
}

async function promptDefault(label, defaultValue) {
  const answer = await rl.question(`${label} [${defaultValue}]: `);
  return answer.trim() || defaultValue;
}

async function promptRequired(label, currentValue) {
  if (currentValue?.trim()) {
    return currentValue.trim();
  }

  while (true) {
    const answer = await rl.question(`${label}: `);
    if (answer.trim()) {
      return answer.trim();
    }
    console.log('Value is required.');
  }
}

function safeName(value) {
  return value.toLowerCase().replace(/[^a-z0-9_.-]/g, '-');
}

const carId = await promptRequired('CAR_ID', process.env.CAR_ID);
const backendUrl = await promptDefault(
  'BACKEND_URL',
  process.env.BACKEND_URL || 'http://host.docker.internal:3000',
);
const telemetryKey = await promptDefault(
  'TELEMETRY_DEVICE_KEY',
  process.env.TELEMETRY_DEVICE_KEY || 'dev-telemetry-key',
);
const initialLat = await promptDefault('INITIAL_LAT', process.env.INITIAL_LAT || '54.3282');
const initialLon = await promptDefault('INITIAL_LON', process.env.INITIAL_LON || '48.3866');
const routingUrl = await promptDefault(
  'ROUTING_URL, empty for fallback',
  process.env.ROUTING_URL || '',
);

await rl.close();

const routeMinLat = process.env.ROUTE_MIN_LAT || '54.27';
const routeMinLon = process.env.ROUTE_MIN_LON || '48.28';
const routeMaxLat = process.env.ROUTE_MAX_LAT || '54.39';
const routeMaxLon = process.env.ROUTE_MAX_LON || '48.50';
const containerName = `telemetry-car-${safeName(carId)}`;

if (process.env.NO_BUILD !== '1') {
  run('docker', ['build', '-t', imageName, telemetryRoot]);
}

const existing = capture('docker', [
  'ps',
  '-a',
  '--filter',
  `name=^/${containerName}$`,
  '--format',
  '{{.Names}}',
]);

if (existing === containerName) {
  if (process.env.REPLACE_EXISTING !== '1') {
    console.error(
      `Container ${containerName} already exists. Set REPLACE_EXISTING=1 to replace it.`,
    );
    process.exit(1);
  }
  run('docker', ['rm', '-f', containerName]);
}

const dockerArgs = [
  'run',
  '-d',
  '--name',
  containerName,
  '--restart',
  'unless-stopped',
  '-e',
  `BACKEND_URL=${backendUrl}`,
  '-e',
  `TELEMETRY_DEVICE_KEY=${telemetryKey}`,
  '-e',
  `CAR_ID=${carId}`,
  '-e',
  `INITIAL_LAT=${initialLat}`,
  '-e',
  `INITIAL_LON=${initialLon}`,
  '-e',
  `ROUTE_MIN_LAT=${routeMinLat}`,
  '-e',
  `ROUTE_MIN_LON=${routeMinLon}`,
  '-e',
  `ROUTE_MAX_LAT=${routeMaxLat}`,
  '-e',
  `ROUTE_MAX_LON=${routeMaxLon}`,
  '-e',
  `ROUTING_PROFILE=${process.env.ROUTING_PROFILE || 'driving'}`,
  '-e',
  `IDLE_TELEMETRY_INTERVAL_SEC=${process.env.IDLE_TELEMETRY_INTERVAL_SEC || '60'}`,
  '-e',
  `ACTIVE_TELEMETRY_INTERVAL_SEC=${process.env.ACTIVE_TELEMETRY_INTERVAL_SEC || '10'}`,
  '-e',
  `TRIP_POLL_INTERVAL_SEC=${process.env.TRIP_POLL_INTERVAL_SEC || '5'}`,
  '-e',
  `MIN_SPEED_KMH=${process.env.MIN_SPEED_KMH || '12'}`,
  '-e',
  `MAX_SPEED_KMH=${process.env.MAX_SPEED_KMH || '54'}`,
  '-e',
  `SPEEDING_CHANCE=${process.env.SPEEDING_CHANCE || '0.08'}`,
  '-e',
  `DESTINATION_REFRESH_METERS=${process.env.DESTINATION_REFRESH_METERS || '140'}`,
  '-e',
  `TELEMETRY_SOURCE=${process.env.TELEMETRY_SOURCE || 'fake-car-bun-dynamic'}`,
];

if (routingUrl) {
  dockerArgs.push('-e', `ROUTING_URL=${routingUrl}`);
}

dockerArgs.push(imageName);

run('docker', dockerArgs);

console.log(`Started ${containerName}`);
console.log(`Logs: docker logs -f ${containerName}`);
