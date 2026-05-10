/**
 * Шаблон тарифа в ответах API (чтение).
 */
export class TariffRead {
  id: string;
  name: string;
  pricePerMinute: number;
  pricePerKm: number;
  pausePricePerMinute: number;
  isDefault: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}
