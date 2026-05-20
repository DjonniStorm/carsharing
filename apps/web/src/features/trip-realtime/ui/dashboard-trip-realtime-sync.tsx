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
import {
  parseCarLocationEnvelope,
  parseCarStateChanged,
  parseTripFinished,
  parseTripMetricsUpdated,
  parseTripStateChanged,
} from "../lib/parse-trip-ws";
import { applyCarStateFromWs } from "../model/live-car-fleet";
import { applyCarLocationFromWs } from "../model/live-car-positions";
import {
  applyTripFinishedFromWs,
  applyTripMetricsFromWs,
  applyTripStateFromWs,
  tripRealtimeWatchAtom,
} from "../model/live-trip-overlay";

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

function syncTripSubscriptions(
  socket: Socket,
  wantedTripIds: ReadonlySet<string>,
  subscribedRef: { current: Set<string> },
) {
  for (const id of subscribedRef.current) {
    if (!wantedTripIds.has(id)) {
      socket.emit(TripWsCommand.UnsubscribeTrip, { tripId: id });
      subscribedRef.current.delete(id);
    }
  }
  for (const id of wantedTripIds) {
    if (!subscribedRef.current.has(id)) {
      socket.emit(TripWsCommand.SubscribeTrip, { tripId: id });
      subscribedRef.current.add(id);
    }
  }
}

const DashboardTripRealtimeSync = () => {
  const [token] = useAtom(accessTokenAtom);
  const [cars] = useAtom(carsListAtom);
  const [watchedTrips] = useAtom(tripRealtimeWatchAtom);

  const subscribedCarsRef = useRef(new Set<string>());
  const subscribedTripsRef = useRef(new Set<string>());
  const socketRef = useRef<Socket | null>(null);
  const carsRef = useRef(cars);
  const watchedTripsRef = useRef(watchedTrips);
  carsRef.current = cars;
  watchedTripsRef.current = watchedTrips;

  useEffect(() => {
    if (!token) {
      subscribedCarsRef.current.clear();
      subscribedTripsRef.current.clear();
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

    const onCarState = (raw: unknown) => {
      const parsed = parseCarStateChanged(raw);
      if (!parsed) {
        return;
      }
      rootFrame.run(() => applyCarStateFromWs(parsed));
    };

    const onMetrics = (raw: unknown) => {
      const parsed = parseTripMetricsUpdated(raw);
      if (!parsed) {
        return;
      }
      rootFrame.run(() => applyTripMetricsFromWs(parsed));
    };

    const onStateChanged = (raw: unknown) => {
      const parsed = parseTripStateChanged(raw);
      if (!parsed) {
        return;
      }
      rootFrame.run(() => applyTripStateFromWs(parsed));
    };

    const onFinished = (raw: unknown) => {
      const parsed = parseTripFinished(raw);
      if (!parsed) {
        return;
      }
      rootFrame.run(() => applyTripFinishedFromWs(parsed));
    };

    const onConnect = () => {
      syncCarSubscriptions(socket, carsRef.current, subscribedCarsRef);
      syncTripSubscriptions(
        socket,
        watchedTripsRef.current,
        subscribedTripsRef,
      );
    };

    socket.on("connect", onConnect);
    socket.on(TripWsEvent.CarLocationUpdated, onLocation);
    socket.on(TripWsEvent.CarStateChanged, onCarState);
    socket.on(TripWsEvent.TripMetricsUpdated, onMetrics);
    socket.on(TripWsEvent.TripStateChanged, onStateChanged);
    socket.on(TripWsEvent.TripFinished, onFinished);

    if (socket.connected) {
      syncCarSubscriptions(socket, carsRef.current, subscribedCarsRef);
      syncTripSubscriptions(
        socket,
        watchedTripsRef.current,
        subscribedTripsRef,
      );
    }

    return () => {
      socket.off("connect", onConnect);
      socket.off(TripWsEvent.CarLocationUpdated, onLocation);
      socket.off(TripWsEvent.CarStateChanged, onCarState);
      socket.off(TripWsEvent.TripMetricsUpdated, onMetrics);
      socket.off(TripWsEvent.TripStateChanged, onStateChanged);
      socket.off(TripWsEvent.TripFinished, onFinished);
      for (const id of subscribedCarsRef.current) {
        socket.emit(TripWsCommand.UnsubscribeCar, { carId: id });
      }
      for (const id of subscribedTripsRef.current) {
        socket.emit(TripWsCommand.UnsubscribeTrip, { tripId: id });
      }
      subscribedCarsRef.current.clear();
      subscribedTripsRef.current.clear();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!token || !socket?.connected) {
      return;
    }
    syncCarSubscriptions(socket, cars, subscribedCarsRef);
  }, [cars, token]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!token || !socket?.connected) {
      return;
    }
    syncTripSubscriptions(socket, watchedTrips, subscribedTripsRef);
  }, [watchedTrips, token]);

  return null;
};
DashboardTripRealtimeSync.displayName = "DashboardTripRealtimeSync";

export { DashboardTripRealtimeSync };
