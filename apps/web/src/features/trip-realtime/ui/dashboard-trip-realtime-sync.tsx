import { useAtom } from "@reatom/react";
import { useEffect, useRef } from "react";
import type { Socket } from "socket.io-client";
import { io } from "socket.io-client";

import type { CarRead } from "@/entities/car";
import { rootFrame } from "@/app/store";
import { accessTokenAtom } from "@/features/auth/model/session";
import { carsListAtom } from "@/features/cars/model/cars-list";
import { getApiBaseUrl } from "@/shared/config/env";

import { TripWsCommand, TripWsEvent } from "../constants";
import { applyCarLocationFromWs } from "../model/live-car-positions";

function parseCarLocationEnvelope(data: unknown): {
  carId: string;
  lat: number;
  lng: number;
  positionAt: string;
} | null {
  if (typeof data !== "object" || data === null || !("payload" in data)) {
    return null;
  }
  const payload = (data as { payload: unknown }).payload;
  if (typeof payload !== "object" || payload === null) {
    return null;
  }
  const { carId, lat, lng, positionAt } = payload as Record<string, unknown>;
  if (
    typeof carId !== "string" ||
    typeof lat !== "number" ||
    typeof lng !== "number" ||
    typeof positionAt !== "string"
  ) {
    return null;
  }
  return { carId, lat, lng, positionAt };
}

function syncCarSubscriptions(
  socket: Socket,
  cars: CarRead[] | null,
  subscribedRef: { current: Set<string> },
) {
  const list = cars ?? [];
  const wanted = new Set(list.filter((c) => !c.isDeleted).map((c) => c.id));

  for (const id of subscribedRef.current) {
    if (!wanted.has(id)) {
      socket.emit(TripWsCommand.UnsubscribeCar, { carId: id });
      subscribedRef.current.delete(id);
    }
  }
  for (const id of wanted) {
    if (!subscribedRef.current.has(id)) {
      socket.emit(TripWsCommand.SubscribeCar, { carId: id });
      subscribedRef.current.add(id);
    }
  }
}

/**
 * Держит Socket.IO к `/trip`, подписывается на машины из {@link carsListAtom}.
 * Без UI — монтируется в layout дашборда.
 */
const DashboardTripRealtimeSync = () => {
  const [token] = useAtom(accessTokenAtom);
  const [cars] = useAtom(carsListAtom);
  const subscribedRef = useRef(new Set<string>());
  const socketRef = useRef<Socket | null>(null);
  const carsRef = useRef(cars);
  carsRef.current = cars;

  useEffect(() => {
    if (!token) {
      subscribedRef.current.clear();
      socketRef.current?.disconnect();
      socketRef.current = null;
      return;
    }

    const base = getApiBaseUrl();
    const socket = io(`${base}/trip`, {
      auth: { token },
      transports: ["websocket", "polling"],
      autoConnect: true,
    });
    socketRef.current = socket;

    const onLocation = (raw: unknown) => {
      const parsed = parseCarLocationEnvelope(raw);
      if (!parsed) {
        return;
      }
      rootFrame.run(() => applyCarLocationFromWs(parsed));
    };

    const onConnect = () => {
      syncCarSubscriptions(socket, carsRef.current, subscribedRef);
    };

    socket.on("connect", onConnect);
    socket.on(TripWsEvent.CarLocationUpdated, onLocation);

    if (socket.connected) {
      syncCarSubscriptions(socket, carsRef.current, subscribedRef);
    }

    return () => {
      socket.off("connect", onConnect);
      socket.off(TripWsEvent.CarLocationUpdated, onLocation);
      for (const id of subscribedRef.current) {
        socket.emit(TripWsCommand.UnsubscribeCar, { carId: id });
      }
      subscribedRef.current.clear();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!token || !socket?.connected) {
      return;
    }
    syncCarSubscriptions(socket, cars, subscribedRef);
  }, [cars, token]);

  return null;
};
DashboardTripRealtimeSync.displayName = "DashboardTripRealtimeSync";

export { DashboardTripRealtimeSync };
