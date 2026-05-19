import { action, atom, wrap } from "@reatom/core";

import type { CarRead } from "@/entities/car";
import type { TripRead } from "@/entities/trip";
import type { ReadUser } from "@/entities/user";
import { usersApi } from "@/features/auth/api";
import { carsApi } from "@/features/cars/api";
import { pickOngoingTrip } from "@/features/dashboard/lib/pick-ongoing-trip";
import { tripsApi } from "@/features/trips/api";
import { violationsApi } from "@/features/violations/api";
import type { AsyncStatus } from "@/shared/model/async-status";

export type DashboardSelectedCarData = {
  car: CarRead | null;
  ongoingTrip: TripRead | null;
  driver: ReadUser | null;
  violationsCount: number | null;
};

export const dashboardSelectedCarAtom = atom<DashboardSelectedCarData>(
  {
    car: null,
    ongoingTrip: null,
    driver: null,
    violationsCount: null,
  },
  "dashboardSelectedCar",
);

export const dashboardSelectedCarStatusAtom = atom<AsyncStatus>(
  "idle",
  "dashboardSelectedCarStatus",
);

export const dashboardSelectedCarErrorAtom = atom<string | null>(
  null,
  "dashboardSelectedCarError",
);

let dashboardSelectedCarLoadSeq = 0;

export const resetDashboardSelectedCar = action(() => {
  dashboardSelectedCarAtom.set({
    car: null,
    ongoingTrip: null,
    driver: null,
    violationsCount: null,
  });
  dashboardSelectedCarStatusAtom.set("idle");
  dashboardSelectedCarErrorAtom.set(null);
  dashboardSelectedCarLoadSeq += 1;
}, "resetDashboardSelectedCar");

export const loadDashboardSelectedCar = action(async (carId: string) => {
  const seq = ++dashboardSelectedCarLoadSeq;
  dashboardSelectedCarStatusAtom.set("loading");
  dashboardSelectedCarErrorAtom.set(null);

  try {
    const car = await wrap(carsApi.findById(carId));
    const trips = await wrap(tripsApi.findAll({ carId }));
    const ongoingTrip = pickOngoingTrip(trips);

    let driver: ReadUser | null = null;
    let violationsCount: number | null = null;
    if (ongoingTrip) {
      try {
        driver = await wrap(usersApi.findById(ongoingTrip.userId));
      } catch {
        driver = null;
      }
      try {
        const viol = await wrap(violationsApi.findByTripId(ongoingTrip.id));
        violationsCount = viol.length;
      } catch {
        violationsCount = null;
      }
    }

    if (seq !== dashboardSelectedCarLoadSeq) {
      return;
    }

    dashboardSelectedCarAtom.set({
      car,
      ongoingTrip,
      driver,
      violationsCount,
    });
    dashboardSelectedCarStatusAtom.set("idle");
  } catch (e) {
    if (seq !== dashboardSelectedCarLoadSeq) {
      return;
    }
    dashboardSelectedCarErrorAtom.set(
      e instanceof Error ? e.message : String(e),
    );
    dashboardSelectedCarAtom.set({
      car: null,
      ongoingTrip: null,
      driver: null,
      violationsCount: null,
    });
    dashboardSelectedCarStatusAtom.set("error");
  }
}, "loadDashboardSelectedCar");
