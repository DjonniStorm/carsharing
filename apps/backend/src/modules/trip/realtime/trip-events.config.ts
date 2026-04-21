/**
 * Временный (v1) контракт WS-событий для модуля поездок.
 * Пока без авторизации: используем метки audience/channelScope как договорённость.
 */
import type { TripWsEventName } from './trip-events.payloads';
import { TripWsEvent } from '../entities/realtime/trip-event';
import { UserRole } from '../../user/entities/user.role';
import {
  TripRealtimeAudienceGroup,
  type TripEventAudience,
  TripEventChannelScope,
} from '../common/trip-realtime.contract';
export { TRIP_WS_SUBSCRIPTION_COMMANDS } from '../common/trip-realtime.contract';

export type TripEventConfigItem = {
  event: TripWsEventName;
  audience: TripEventAudience;
  channelScope: TripEventChannelScope;
  description: string;
  payloadShape: string[];
};

/**
 * События (server -> client/internal).
 */
export const TRIP_WS_EVENTS: readonly TripEventConfigItem[] = [
  {
    event: TripWsEvent.ConnectionReady,
    audience: TripRealtimeAudienceGroup.DRIVER_AND_MANAGER,
    channelScope: TripEventChannelScope.InternalPipeline,
    description: 'Сервер подтвердил готовность WS-соединения.',
    payloadShape: ['connectionId', 'ts'],
  },
  {
    event: TripWsEvent.SubscriptionOk,
    audience: TripRealtimeAudienceGroup.DRIVER_AND_MANAGER,
    channelScope: TripEventChannelScope.InternalPipeline,
    description: 'Подтверждение успешной подписки/отписки.',
    payloadShape: ['action', 'channel', 'entityId?', 'ts'],
  },
  {
    event: TripWsEvent.SubscriptionError,
    audience: TripRealtimeAudienceGroup.DRIVER_AND_MANAGER,
    channelScope: TripEventChannelScope.InternalPipeline,
    description:
      'Ошибка подписки (нет прав, сущность не найдена, bad payload).',
    payloadShape: ['action', 'channel', 'errorCode', 'message', 'ts'],
  },
  {
    event: TripWsEvent.TripStateChanged,
    audience: TripRealtimeAudienceGroup.DRIVER_AND_MANAGER,
    channelScope: TripEventChannelScope.DriverTrip,
    description:
      'Изменился статус поездки (pending/active/paused/finished...).',
    payloadShape: ['tripId', 'carId', 'status', 'previousStatus?', 'ts'],
  },
  {
    event: TripWsEvent.TripMetricsUpdated,
    audience: TripRealtimeAudienceGroup.DRIVER_AND_MANAGER,
    channelScope: TripEventChannelScope.DriverTrip,
    description: 'Обновлены метрики поездки (время, дистанция, цены).',
    payloadShape: [
      'tripId',
      'carId',
      'distanceMeters',
      'chargedMinutes',
      'chargedKm',
      'priceTime',
      'priceDistance',
      'pricePause',
      'priceTotal',
      'ts',
    ],
  },
  {
    event: TripWsEvent.TripRoutePoint,
    audience: TripRealtimeAudienceGroup.DRIVER_AND_MANAGER,
    channelScope: TripEventChannelScope.DriverTrip,
    description: 'Новая точка трека активной поездки.',
    payloadShape: ['tripId', 'carId', 'lat', 'lng', 'speed?', 'recordedAt'],
  },
  {
    event: TripWsEvent.TripFinished,
    audience: TripRealtimeAudienceGroup.DRIVER_AND_MANAGER,
    channelScope: TripEventChannelScope.DriverTrip,
    description: 'Поездка завершена: финальные метрики и стоимость.',
    payloadShape: [
      'tripId',
      'carId',
      'finishedAt',
      'distanceMeters',
      'chargedMinutes',
      'chargedKm',
      'priceTotal',
      'ts',
    ],
  },
  {
    event: TripWsEvent.TripWarning,
    audience: TripRealtimeAudienceGroup.DRIVER_AND_MANAGER,
    channelScope: TripEventChannelScope.DriverTrip,
    description: 'Некритичное предупреждение в контексте поездки.',
    payloadShape: ['tripId', 'carId', 'warningCode', 'message', 'ts'],
  },
  {
    event: TripWsEvent.TripError,
    audience: TripRealtimeAudienceGroup.DRIVER_AND_MANAGER,
    channelScope: TripEventChannelScope.DriverTrip,
    description: 'Критичная ошибка поездки.',
    payloadShape: ['tripId', 'carId', 'errorCode', 'message', 'ts'],
  },
  {
    event: TripWsEvent.CarStateChanged,
    audience: UserRole.MANAGER,
    channelScope: TripEventChannelScope.ManagerCar,
    description: 'Изменился статус машины (доступность/состояние).',
    payloadShape: ['carId', 'status', 'isAvailable', 'fuelLevel?', 'ts'],
  },
  {
    event: TripWsEvent.CarLocationUpdated,
    audience: UserRole.MANAGER,
    channelScope: TripEventChannelScope.ManagerCar,
    description: 'Обновлена текущая позиция машины на карте.',
    payloadShape: ['carId', 'lat', 'lng', 'positionAt'],
  },
  {
    event: TripWsEvent.FleetSummaryUpdated,
    audience: UserRole.MANAGER,
    channelScope: TripEventChannelScope.ManagerFleet,
    description: 'Обновлены агрегаты автопарка для live-панели менеджера.',
    payloadShape: [
      'totalCars',
      'availableCars',
      'inUseCars',
      'maintenanceCars',
      'activeTrips',
      'ts',
    ],
  },
  {
    event: TripWsEvent.TelemetryReceived,
    audience: TripRealtimeAudienceGroup.INTERNAL,
    channelScope: TripEventChannelScope.InternalPipeline,
    description: 'Сервер получил свежий пакет телеметрии.',
    payloadShape: ['carId', 'tripId?', 'receivedAt'],
  },
  {
    event: TripWsEvent.TelemetryTimeout,
    audience: UserRole.MANAGER,
    channelScope: TripEventChannelScope.ManagerCar,
    description: 'От машины давно не было телеметрии (порог таймаута).',
    payloadShape: ['carId', 'tripId?', 'lastTelemetryAt', 'timeoutSec', 'ts'],
  },
  {
    event: TripWsEvent.ViolationCreated,
    audience: UserRole.MANAGER,
    channelScope: TripEventChannelScope.ManagerTrip,
    description:
      'Зафиксировано нарушение. Событие зарезервировано, пока доменная логика не реализована.',
    payloadShape: [
      'violationId',
      'tripId',
      'carId',
      'type',
      'severity',
      'description?',
      'ts',
    ],
  },
] as const;

/**
 * Быстрый lookup по имени события.
 */
export const TRIP_WS_EVENTS_BY_NAME = Object.fromEntries(
  TRIP_WS_EVENTS.map((event) => [event.event, event]),
) as Record<TripWsEventName, TripEventConfigItem>;
