/** Строка результата raw-SQL для истории поездки (json поля из PostgreSQL). */
export type TripHistorySqlRow = {
  trip_json: unknown;
  car_json: unknown;
  violations_json: unknown;
};

/** Как {@link TripHistorySqlRow}, плюс агрегированная телеметрия по поездке. */
export type TripHistoryFullSqlRow = TripHistorySqlRow & {
  telemetry_json: unknown;
};
