import type { MantineColor } from "@mantine/core";

import { CarStatus } from "@/entities/car";
import type { LangKey } from "@/shared/i18n/keys";
import { LANG_KEYS } from "@/shared/i18n/keys";

/** Порядок сегментов в диаграмме и фильтре статусов. */
export const CAR_STATUSES_ORDERED: CarStatus[] = [
  CarStatus.AVAILABLE,
  CarStatus.IN_USE,
  CarStatus.MAINTENANCE,
  CarStatus.UNAVAILABLE,
  CarStatus.OUT_OF_SERVICE,
  CarStatus.CREATED,
  CarStatus.UNKNOWN,
];

export function carStatusLangKey(status: CarStatus): LangKey {
  switch (status) {
    case CarStatus.AVAILABLE:
      return LANG_KEYS.pages.carsStatusAvailable;
    case CarStatus.UNAVAILABLE:
      return LANG_KEYS.pages.carsStatusUnavailable;
    case CarStatus.IN_USE:
      return LANG_KEYS.pages.carsStatusInUse;
    case CarStatus.MAINTENANCE:
      return LANG_KEYS.pages.carsStatusMaintenance;
    case CarStatus.OUT_OF_SERVICE:
      return LANG_KEYS.pages.carsStatusOutOfService;
    case CarStatus.CREATED:
      return LANG_KEYS.pages.carsStatusCreated;
    case CarStatus.UNKNOWN:
      return LANG_KEYS.pages.carsStatusUnknown;
  }
}

export function carStatusBadgeColor(status: CarStatus): MantineColor {
  switch (status) {
    case CarStatus.AVAILABLE:
      return "green";
    case CarStatus.IN_USE:
      return "blue";
    case CarStatus.MAINTENANCE:
      return "yellow";
    case CarStatus.UNAVAILABLE:
      return "gray";
    case CarStatus.OUT_OF_SERVICE:
      return "red";
    case CarStatus.CREATED:
      return "cyan";
    case CarStatus.UNKNOWN:
      return "dark";
  }
}

/** Цвет сегмента для `@mantine/charts` (токены палитры). */
export function carStatusChartColor(status: CarStatus): MantineColor {
  switch (status) {
    case CarStatus.AVAILABLE:
      return "green.6";
    case CarStatus.IN_USE:
      return "blue.6";
    case CarStatus.MAINTENANCE:
      return "yellow.6";
    case CarStatus.UNAVAILABLE:
      return "gray.6";
    case CarStatus.OUT_OF_SERVICE:
      return "red.6";
    case CarStatus.CREATED:
      return "cyan.6";
    case CarStatus.UNKNOWN:
      return "dark.4";
  }
}
