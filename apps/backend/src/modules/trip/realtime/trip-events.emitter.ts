import type { TripEventConfigItem } from './trip-events.config';
import { TRIP_WS_EVENTS_BY_NAME } from './trip-events.config';
import type {
  TripWsEnvelope,
  TripWsEventPayloadMap,
} from './trip-events.payloads';

/**
 * Типобезопасная сборка события для дальнейшей отправки в gateway/broker.
 * Зачем: единая точка формирования envelope и проверка payload на этапе компиляции.
 */
export function createTripWsEvent<E extends keyof TripWsEventPayloadMap>(
  event: E,
  payload: TripWsEventPayloadMap[E],
  params: {
    eventId: string;
    ts: string;
  },
): TripWsEnvelope<E, TripWsEventPayloadMap[E]> {
  const eventConfig: TripEventConfigItem = TRIP_WS_EVENTS_BY_NAME[event];
  return {
    eventId: params.eventId,
    event,
    ts: params.ts,
    audience: eventConfig.audience,
    channelScope: eventConfig.channelScope,
    payload,
  };
}
