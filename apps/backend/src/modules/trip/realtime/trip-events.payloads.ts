import { TripStatus } from '../entities/trip.status';
import { TripWsEvent } from '../entities/realtime/trip-event';
import {
  TripWsCommand,
  type TripEventAudience,
  type TripEventChannelScope,
} from '../common/trip-realtime.contract';

export type TripWsEventName = TripWsEvent;

export type WsSubscriptionAction =
  (typeof TripWsCommand)[keyof typeof TripWsCommand];

/**
 * Базовая обёртка любого события в WS-шине.
 * Зачем: единый envelope упрощает логирование, дедупликацию и отладку.
 */
export class TripWsEnvelope<
  TName extends TripWsEventName,
  TPayload extends object,
> {
  eventId: string;
  event: TName;
  ts: string;
  audience: TripEventAudience;
  channelScope: TripEventChannelScope;
  payload: TPayload;
}

/** Системное событие: сокет готов к работе. */
export class ConnectionReadyPayload {
  connectionId: string;
  ts: string;
}

/** Подтверждение команды подписки/отписки. */
export class SubscriptionOkPayload {
  action: WsSubscriptionAction;
  channel: string;
  entityId?: string;
  ts: string;
}

/** Ошибка подписки/отписки. */
export class SubscriptionErrorPayload {
  action: WsSubscriptionAction;
  channel: string;
  errorCode: string;
  message: string;
  ts: string;
}

/** Изменение статуса поездки. */
export class TripStateChangedPayload {
  tripId: number;
  carId: string;
  status: TripStatus;
  previousStatus?: TripStatus;
  ts: string;
}

/** Пересчитанные метрики и стоимость поездки. */
export class TripMetricsUpdatedPayload {
  tripId: number;
  carId: string;
  distanceMeters: number | null;
  chargedMinutes: number | null;
  chargedKm: number | null;
  priceTime: number | null;
  priceDistance: number | null;
  pricePause: number | null;
  priceTotal: number | null;
  ts: string;
}

/** Новая точка маршрута активной поездки. */
export class TripRoutePointPayload {
  tripId: number;
  carId: string;
  lat: number;
  lng: number;
  speed?: number;
  recordedAt: string;
}

/** Финальный snapshot после завершения поездки. */
export class TripFinishedPayload {
  tripId: number;
  carId: string;
  finishedAt: string;
  distanceMeters: number | null;
  chargedMinutes: number | null;
  chargedKm: number | null;
  priceTotal: number | null;
  ts: string;
}

/** Некритичное предупреждение в поездке. */
export class TripWarningPayload {
  tripId: number;
  carId: string;
  warningCode: string;
  message: string;
  ts: string;
}

/** Критическая ошибка поездки. */
export class TripErrorPayload {
  tripId: number;
  carId: string;
  errorCode: string;
  message: string;
  ts: string;
}

/** Изменение состояния машины для live-панели менеджера. */
export class CarStateChangedPayload {
  carId: string;
  status: number;
  isAvailable: boolean;
  fuelLevel?: number;
  ts: string;
}

/** Новая геопозиция машины. */
export class CarLocationUpdatedPayload {
  carId: string;
  lat: number;
  lng: number;
  positionAt: string;
}

/** Агрегированная сводка автопарка. */
export class FleetSummaryUpdatedPayload {
  totalCars: number;
  availableCars: number;
  inUseCars: number;
  maintenanceCars: number;
  activeTrips: number;
  ts: string;
}

/** Входящий пакет телеметрии принят сервером. */
export class TelemetryReceivedPayload {
  carId: string;
  tripId?: number;
  receivedAt: string;
}

/** Превышен таймаут отсутствия телеметрии. */
export class TelemetryTimeoutPayload {
  carId: string;
  tripId?: number;
  lastTelemetryAt: string;
  timeoutSec: number;
  ts: string;
}

/** Событие нарушения (зарезервировано на будущую реализацию). */
export class ViolationCreatedPayload {
  violationId: number;
  tripId: number;
  carId: string;
  type: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description?: string;
  ts: string;
}

export type TripWsEventPayloadMap = {
  [TripWsEvent.ConnectionReady]: ConnectionReadyPayload;
  [TripWsEvent.SubscriptionOk]: SubscriptionOkPayload;
  [TripWsEvent.SubscriptionError]: SubscriptionErrorPayload;
  [TripWsEvent.TripStateChanged]: TripStateChangedPayload;
  [TripWsEvent.TripMetricsUpdated]: TripMetricsUpdatedPayload;
  [TripWsEvent.TripRoutePoint]: TripRoutePointPayload;
  [TripWsEvent.TripFinished]: TripFinishedPayload;
  [TripWsEvent.TripWarning]: TripWarningPayload;
  [TripWsEvent.TripError]: TripErrorPayload;
  [TripWsEvent.CarStateChanged]: CarStateChangedPayload;
  [TripWsEvent.CarLocationUpdated]: CarLocationUpdatedPayload;
  [TripWsEvent.FleetSummaryUpdated]: FleetSummaryUpdatedPayload;
  [TripWsEvent.TelemetryReceived]: TelemetryReceivedPayload;
  [TripWsEvent.TelemetryTimeout]: TelemetryTimeoutPayload;
  [TripWsEvent.ViolationCreated]: ViolationCreatedPayload;
};
