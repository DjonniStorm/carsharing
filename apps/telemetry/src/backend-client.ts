import type { TelemetryConfig } from './config';

export type Trip = {
  id: string;
  carId: string;
  status: number;
};

export type Car = {
  id: string;
  lastKnownLat: number | null;
  lastKnownLon: number | null;
  fuelLevel: number;
};

export type TelemetryPayload = {
  timestamp: string;
  lat: number;
  lon: number;
  speed: number;
  acceleration: number;
  fuelLevel: number;
  source: string;
};

export class BackendClient {
  constructor(private readonly config: TelemetryConfig) {}

  async getCar(): Promise<Car> {
    return this.request<Car>(`/telemetry/cars/${this.config.carId}/car`);
  }

  async updateCarPosition(
    lastKnownLat: number,
    lastKnownLon: number,
    lastPositionAt: Date,
  ): Promise<void> {
    await this.request(`/telemetry/cars/${this.config.carId}/position`, {
      method: 'POST',
      body: {
        lat: lastKnownLat,
        lon: lastKnownLon,
        positionAt: lastPositionAt.toISOString(),
      },
    });
  }

  async findActiveTrip(): Promise<Trip | null> {
    return this.request<Trip | null>(`/telemetry/cars/${this.config.carId}/active-trip`);
  }

  async sendTelemetry(payload: TelemetryPayload): Promise<void> {
    await this.request(`/telemetry/cars/${this.config.carId}`, {
      method: 'POST',
      body: payload,
    });
  }

  private async request<T>(
    path: string,
    options: {
      method?: string;
      body?: unknown;
    } = {},
  ): Promise<T> {
    const headers = new Headers();
    headers.set('accept', 'application/json');
    headers.set('x-telemetry-key', this.config.telemetryKey);

    if (options.body !== undefined) {
      headers.set('content-type', 'application/json');
    }

    const response = await fetch(`${this.config.backendUrl}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`${options.method ?? 'GET'} ${path} failed: ${response.status} ${text}`);
    }

    if (response.status === 204) {
      return undefined as T;
    }
    return (await response.json()) as T;
  }
}
