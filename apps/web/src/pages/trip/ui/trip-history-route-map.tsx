import { useMemo } from "react";

import type { GeozoneRead } from "@/entities/geozone";
import type { TelemetryPointRead } from "@/entities/trip";
import { Alert, Stack, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";

import { LANG_KEYS } from "@/shared/i18n/keys";
import type { YandexMapOverlayMarker } from "@/shared/lib/yandex-maps/yandex-maps-render-service";
import type { YMapLngLat } from "@/shared/lib/yandex-maps/ymaps3";
import { YandexMapPlain } from "@/widgets/yandex-map";

import { tripRouteMapViewport } from "@/pages/trip/lib/trip-route-map-viewport";

export type TripHistoryRouteMapProps = {
  apiKey: string;
  points: TelemetryPointRead[];
  tripGeozone: GeozoneRead | null;
};

const TripHistoryRouteMap = ({
  apiKey,
  points,
  tripGeozone,
}: TripHistoryRouteMapProps) => {
  const { t } = useTranslation();

  const routeLine = useMemo((): YMapLngLat[] => {
    const line: YMapLngLat[] = [];
    for (const p of points) {
      if (!Number.isFinite(p.lon) || !Number.isFinite(p.lat)) {
        continue;
      }
      line.push([p.lon, p.lat]);
    }
    return line;
  }, [points]);

  const zoneGeom = tripGeozone?.currentVersion?.geometry;

  const { center, zoom } = useMemo(() => {
    return tripRouteMapViewport(routeLine, zoneGeom);
  }, [routeLine, zoneGeom]);

  const geozonesForMap = useMemo(() => {
    return tripGeozone ? [tripGeozone] : null;
  }, [tripGeozone]);

  /** Чипы старт/финиш по первой/последней координате трека (если их хотя бы две). */
  const startFinishMarkers = useMemo<
    YandexMapOverlayMarker[] | undefined
  >(() => {
    if (routeLine.length < 2) {
      return undefined;
    }
    const start = routeLine[0];
    const finish = routeLine[routeLine.length - 1];
    return [
      {
        id: "trip-start",
        coordinates: start,
        label: t(LANG_KEYS.pages.tripDetailMapStart),
        tone: "tripStart",
      },
      {
        id: "trip-finish",
        coordinates: finish,
        label: t(LANG_KEYS.pages.tripDetailMapFinish),
        tone: "tripFinish",
      },
    ];
  }, [routeLine, t]);

  if (!apiKey.trim()) {
    return (
      <Alert color="gray" variant="light">
        {t(LANG_KEYS.map.emptyKey)}
      </Alert>
    );
  }

  return (
    <Stack gap="xs">
      {routeLine.length < 2 ? (
        <Text size="sm" c="dimmed">
          {t(LANG_KEYS.pages.tripDetailMapNoRoute)}
        </Text>
      ) : null}
      <YandexMapPlain
        apiKey={apiKey}
        center={center}
        zoom={zoom}
        height={380}
        geozones={geozonesForMap}
        routeLine={routeLine.length >= 2 ? routeLine : null}
        overlayMarkers={startFinishMarkers}
      />
      <Text size="xs" c="dimmed">
        {t(LANG_KEYS.pages.tripDetailMapLegend)}
      </Text>
    </Stack>
  );
};
TripHistoryRouteMap.displayName = "TripHistoryRouteMap";

export { TripHistoryRouteMap };
