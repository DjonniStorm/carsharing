import { action, atom } from "@reatom/core";

export type LiveCarCoords = {
  lat: number;
  lng: number;
  positionAt: string;
};

/** Последние координаты по `carId` из WS (`car.location.updated`). */
export const liveCarPositionsAtom = atom<Record<string, LiveCarCoords>>(
  {},
  "liveCarPositions",
);

const throttleMsByCar = new Map<string, number>();
const THROTTLE_MS = 120;

export const applyCarLocationFromWs = action(
  (payload: LiveCarCoords & { carId: string }) => {
    const now = Date.now();
    const last = throttleMsByCar.get(payload.carId) ?? 0;
    if (now - last < THROTTLE_MS) {
      return;
    }
    throttleMsByCar.set(payload.carId, now);
    const prev = liveCarPositionsAtom();
    liveCarPositionsAtom.set({
      ...prev,
      [payload.carId]: {
        lat: payload.lat,
        lng: payload.lng,
        positionAt: payload.positionAt,
      },
    });
  },
  "applyCarLocationFromWs",
);

export const resetLiveCarPositions = action(() => {
  liveCarPositionsAtom.set({});
  throttleMsByCar.clear();
}, "resetLiveCarPositions");
