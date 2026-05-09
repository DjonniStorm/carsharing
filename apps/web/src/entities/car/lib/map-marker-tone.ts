import type { YandexMapOverlayMarker } from "@/shared/lib/yandex-maps/yandex-maps-render-service";

import { CarStatus } from "@/entities/car/model/car-status";
import type { CarRead } from "@/entities/car/model/car-read";

export function carToMapMarker(car: CarRead): YandexMapOverlayMarker | null {
  const lon = car.lastKnownLon;
  const lat = car.lastKnownLat;
  if (lon == null || lat == null) {
    return null;
  }
  return {
    coordinates: [lon, lat],
    label: car.licensePlate,
    tone: carStatusToTone(car.carStatus),
  };
}

export function carStatusToTone(
  status: CarStatus,
): NonNullable<YandexMapOverlayMarker["tone"]> {
  if (status === CarStatus.AVAILABLE) {
    return "available";
  }
  if (status === CarStatus.IN_USE) {
    return "inUse";
  }
  return "offline";
}
