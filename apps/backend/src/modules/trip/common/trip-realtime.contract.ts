import { UserRole } from '../../user/entities/user.role';

/**
 * Варианты получателей именно для realtime-контракта trip-модуля.
 * Базовые роли берём из UserRole, добавляем групповые варианты.
 */
export enum TripRealtimeAudienceGroup {
  DRIVER_AND_MANAGER = 'driver_and_manager',
  INTERNAL = 'internal',
}

export type TripEventAudience = UserRole | TripRealtimeAudienceGroup;

export enum TripEventChannelScope {
  DriverTrip = 'driver:trip:{tripId}',
  ManagerTrip = 'manager:trip:{tripId}',
  ManagerCar = 'manager:car:{carId}',
  ManagerFleet = 'manager:fleet',
  InternalPipeline = 'internal:pipeline',
}

/**
 * Команды подписки (client -> server) централизованы в одном объекте.
 * Зачем: избежать строковых дублей в gateway/тестах/клиентских адаптерах.
 */
export const TripWsCommand = {
  SubscribeTrip: 'subscribe.trip',
  UnsubscribeTrip: 'unsubscribe.trip',
  SubscribeCar: 'subscribe.car',
  UnsubscribeCar: 'unsubscribe.car',
  SubscribeFleet: 'subscribe.fleet',
  UnsubscribeFleet: 'unsubscribe.fleet',
} as const;

export type TripWsCommandName =
  (typeof TripWsCommand)[keyof typeof TripWsCommand];

export type TripWsSubscriptionCommandItem = {
  command: TripWsCommandName;
  description: string;
  args: readonly string[];
};

export const TRIP_WS_SUBSCRIPTION_COMMANDS: readonly TripWsSubscriptionCommandItem[] =
  [
    {
      command: TripWsCommand.SubscribeTrip,
      description: 'Подписка на live-события конкретной поездки.',
      args: ['tripId'],
    },
    {
      command: TripWsCommand.UnsubscribeTrip,
      description: 'Отписка от live-событий поездки.',
      args: ['tripId'],
    },
    {
      command: TripWsCommand.SubscribeCar,
      description: 'Подписка менеджера на конкретную машину.',
      args: ['carId'],
    },
    {
      command: TripWsCommand.UnsubscribeCar,
      description: 'Отписка менеджера от машины.',
      args: ['carId'],
    },
    {
      command: TripWsCommand.SubscribeFleet,
      description: 'Подписка менеджера на агрегированные события флита.',
      args: [],
    },
    {
      command: TripWsCommand.UnsubscribeFleet,
      description: 'Отписка менеджера от флита.',
      args: [],
    },
  ] as const;
