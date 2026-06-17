import { useEffect, useMemo, useState } from "react";

import type { CarRead } from "@/entities/car";
import type { ViolationRead } from "@/entities/violation";
import { TripStatus } from "@/entities/trip";
import { carsApi } from "@/features/cars/api";
import { isBlockingOpenViolation } from "@/features/cars/lib/car-return-to-service-present";
import { tripHistoryApi, tripsApi } from "@/features/trips/api";
import { resolveApiErrorMessage } from "@/shared/api";

export type CarReturnToServiceLoadPhase = "loading" | "ok" | "error";

export function useCarReturnToServiceLoad(carId: string) {
  const [car, setCar] = useState<CarRead | null>(null);
  const [violations, setViolations] = useState<ViolationRead[]>([]);
  const [tripId, setTripId] = useState<string | null>(null);
  const [phase, setPhase] = useState<CarReturnToServiceLoadPhase>("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setPhase("loading");
      setError(null);
      try {
        const carRes = await carsApi.findById(carId);
        const finishedTrips = await tripsApi.findAll({
          carId,
          status: TripStatus.FINISHED,
        });
        const latestTrip = finishedTrips[0] ?? null;
        let tripViolations: ViolationRead[] = [];

        if (latestTrip) {
          const full = await tripHistoryApi.getFull(latestTrip.id);
          tripViolations = full.violations;
          if (!cancelled) {
            setTripId(latestTrip.id);
          }
        } else if (!cancelled) {
          setTripId(null);
        }

        if (!cancelled) {
          setCar(carRes);
          setViolations(tripViolations);
          setPhase("ok");
        }
      } catch (e) {
        if (!cancelled) {
          setPhase("error");
          setError(resolveApiErrorMessage(e));
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [carId]);

  const blockingViolations = useMemo(() => {
    return violations.filter((v) => isBlockingOpenViolation(v.type));
  }, [violations]);

  const canProceedFromDiagnosis = blockingViolations.length === 0;

  return {
    car,
    violations,
    blockingViolations,
    tripId,
    phase,
    error,
    canProceedFromDiagnosis,
    reloadCar: async () => {
      const carRes = await carsApi.findById(carId);
      setCar(carRes);
      return carRes;
    },
  };
}
