import { BackendClient } from './backend-client';
import { readConfig } from './config';
import { FallbackRouteProvider, OsrmRouteProvider, ResilientRouteProvider } from './route-provider';
import { TelemetrySimulator } from './simulator';

const config = readConfig();
const client = new BackendClient(config);
const routeProvider = new ResilientRouteProvider(
  new OsrmRouteProvider(config),
  new FallbackRouteProvider(config),
);
const simulator = new TelemetrySimulator(config, client, routeProvider);

await simulator.start();
