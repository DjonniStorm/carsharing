/** Ответ API: глобальный шаблон тарифа (TariffPreset). */
export type TariffRead = {
  id: string;
  name: string;
  pricePerMinute: number;
  pricePerKm: number;
  pausePricePerMinute: number;
  isDefault: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
};

export type TariffCreateBody = {
  name: string;
  pricePerMinute: number;
  pricePerKm: number;
  pausePricePerMinute?: number;
  isDefault?: boolean;
};

export type TariffUpdateBody = {
  name?: string;
  pricePerMinute?: number;
  pricePerKm?: number;
  pausePricePerMinute?: number;
  isDefault?: boolean;
};
