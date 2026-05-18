/** Строка из БД для уведомлений, привязанных к поездке (с id связанных нарушений). */
export class TripNotificationEntity {
  id: number;
  userId: string;
  tripId: string | null;
  message: string;
  status: string;
  violationIds: string[];
}
