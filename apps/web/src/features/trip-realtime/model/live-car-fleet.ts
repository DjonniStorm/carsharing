import { action } from "@reatom/core";

import type { CarRead } from "@/entities/car";
import { carsListAtom } from "@/features/cars/model/cars-list";
import { dashboardSelectedCarAtom } from "@/features/dashboard/model/dashboard-selected-car-state";

import type { CarStateChangedPayload } from "./ws-envelope";

function patchCar(car: CarRead, payload: CarStateChangedPayload): CarRead {
  return {
    ...car,
    carStatus: payload.carStatus,
    isAvailable: payload.isAvailable,
    ...(payload.fuelLevel !== undefined
      ? { fuelLevel: payload.fuelLevel }
      : {}),
    updatedAt: payload.ts,
  };
}

/** Обновляет `carsListAtom` и панель выбранной машины из `car.state.changed`. */
export const applyCarStateFromWs = action((payload: CarStateChangedPayload) => {
  const list = carsListAtom();
  if (list) {
    const idx = list.findIndex((c) => c.id === payload.carId);
    if (idx >= 0) {
      const next = [...list];
      next[idx] = patchCar(next[idx], payload);
      carsListAtom.set(next);
    }
  }

  const selected = dashboardSelectedCarAtom();
  if (selected.car?.id === payload.carId) {
    dashboardSelectedCarAtom.set({
      ...selected,
      car: patchCar(selected.car, payload),
    });
  }
}, "applyCarStateFromWs");
