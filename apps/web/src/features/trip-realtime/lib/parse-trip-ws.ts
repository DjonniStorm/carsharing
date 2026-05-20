import type { CarStatus } from "@/entities/car/model/car-status";
import { CarStatus as CarStatusEnum } from "@/entities/car/model/car-status";
import type { TripStatus } from "@/entities/trip";
import { TripStatus as TripStatusEnum } from "@/entities/trip";

import type {
  CarStateChangedPayload,
  TripFinishedPayload,
  TripMetricsUpdatedPayload,
  TripStateChangedPayload,
} from "../model/ws-envelope";

function readPayload(raw: unknown): Record<string, unknown> | null {
  if (typeof raw !== "object" || raw === null) {
    return null;
  }
  if ("payload" in raw) {
    const payload = (raw as { payload: unknown }).payload;
    if (typeof payload === "object" && payload !== null) {
      return payload as Record<string, unknown>;
    }
    return null;
  }
  return raw as Record<string, unknown>;
}

function readString(v: unknown): string | null {
  return typeof v === "string" && v.length > 0 ? v : null;
}

function readNullableNumber(v: unknown): number | null {
  if (v === null || v === undefined) {
    return null;
  }
  if (typeof v === "number" && Number.isFinite(v)) {
    return v;
  }
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function readTripStatus(v: unknown): TripStatus | null {
  if (typeof v === "number" && Number.isInteger(v)) {
    return v as TripStatus;
  }
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    if (Number.isInteger(n)) {
      return n as TripStatus;
    }
  }
  return null;
}

const VALID_TRIP_STATUSES = new Set<number>(
  Object.values(TripStatusEnum).filter(
    (v): v is number => typeof v === "number",
  ),
);

const VALID_CAR_STATUSES = new Set<number>(
  Object.values(CarStatusEnum).filter(
    (v): v is number => typeof v === "number",
  ),
);

function readCarStatus(v: unknown): CarStatus | null {
  if (typeof v === "number" && Number.isInteger(v)) {
    return v as CarStatus;
  }
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    if (Number.isInteger(n)) {
      return n as CarStatus;
    }
  }
  return null;
}

export function parseTripMetricsUpdated(
  raw: unknown,
): TripMetricsUpdatedPayload | null {
  const p = readPayload(raw);
  if (!p) {
    return null;
  }
  const tripId = readString(p.tripId);
  const carId = readString(p.carId);
  const ts = readString(p.ts);
  if (!tripId || !carId || !ts) {
    return null;
  }
  return {
    tripId,
    carId,
    distanceMeters: readNullableNumber(p.distanceMeters),
    chargedMinutes: readNullableNumber(p.chargedMinutes),
    chargedKm: readNullableNumber(p.chargedKm),
    priceTime: readNullableNumber(p.priceTime),
    priceDistance: readNullableNumber(p.priceDistance),
    pricePause: readNullableNumber(p.pricePause),
    priceTotal: readNullableNumber(p.priceTotal),
    ts,
  };
}

export function parseTripStateChanged(
  raw: unknown,
): TripStateChangedPayload | null {
  const p = readPayload(raw);
  if (!p) {
    return null;
  }
  const tripId = readString(p.tripId);
  const carId = readString(p.carId);
  const ts = readString(p.ts);
  const status = readTripStatus(p.status);
  if (
    !tripId ||
    !carId ||
    !ts ||
    status === null ||
    !VALID_TRIP_STATUSES.has(status)
  ) {
    return null;
  }
  const previousStatus = readTripStatus(p.previousStatus);
  return {
    tripId,
    carId,
    status,
    previousStatus:
      previousStatus !== null && VALID_TRIP_STATUSES.has(previousStatus)
        ? previousStatus
        : undefined,
    ts,
  };
}

export function parseCarStateChanged(
  raw: unknown,
): CarStateChangedPayload | null {
  const p = readPayload(raw);
  if (!p) {
    return null;
  }
  const carId = readString(p.carId);
  const ts = readString(p.ts);
  const carStatus = readCarStatus(p.status);
  if (!carId || !ts || carStatus === null || !VALID_CAR_STATUSES.has(carStatus)) {
    return null;
  }
  const availRaw = p.isAvailable;
  const isAvailable =
    typeof availRaw === "boolean"
      ? availRaw
      : String(availRaw).toLowerCase() === "true";
  const fuel = readNullableNumber(p.fuelLevel);
  return {
    carId,
    carStatus,
    isAvailable,
    ...(fuel !== null ? { fuelLevel: fuel } : {}),
    ts,
  };
}

export function parseTripFinished(raw: unknown): TripFinishedPayload | null {
  const p = readPayload(raw);
  if (!p) {
    return null;
  }
  const tripId = readString(p.tripId);
  const carId = readString(p.carId);
  const finishedAt = readString(p.finishedAt);
  const ts = readString(p.ts);
  if (!tripId || !carId || !finishedAt || !ts) {
    return null;
  }
  return {
    tripId,
    carId,
    finishedAt,
    distanceMeters: readNullableNumber(p.distanceMeters),
    chargedMinutes: readNullableNumber(p.chargedMinutes),
    chargedKm: readNullableNumber(p.chargedKm),
    priceTotal: readNullableNumber(p.priceTotal),
    ts,
  };
}

export function parseCarLocationEnvelope(raw: unknown): {
  carId: string;
  lat: number;
  lng: number;
  positionAt: string;
} | null {
  const p = readPayload(raw);
  if (!p) {
    return null;
  }
  const carId = readString(p.carId);
  const lat = readNullableNumber(p.lat);
  const lng = readNullableNumber(p.lng);
  const positionAt = readString(p.positionAt);
  if (!carId || lat === null || lng === null || !positionAt) {
    return null;
  }
  return { carId, lat, lng, positionAt };
}
