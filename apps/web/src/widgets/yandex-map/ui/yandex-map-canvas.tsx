import { useEffect, useRef, useState } from "react";

import type { GeozoneRead } from "@/entities/geozone";
import type { GeozoneBoundingBoxQuery } from "@/features/geozones/api";
import { Center, Loader, Stack, Text } from "@mantine/core";

import {
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
} from "@/shared/config/map-defaults";
import { LANG_KEYS } from "@/shared/i18n/keys";
import { translate } from "@/shared/i18n/translate";
import { ymapsBoundsToGeozoneQuery } from "@/shared/lib/yandex-maps/map-viewport-bounds";
import {
  attachDefaultFeaturesLayer,
  createGeozonePolygonsController,
  createOverlayMarkersController,
  createTripRoutePolylineController,
  yandexMapsRenderService,
} from "@/shared/lib/yandex-maps/yandex-maps-render-service";
import type {
  OverlayMarkersController,
  TripRoutePolylineController,
  YandexMapOverlayMarker,
} from "@/shared/lib/yandex-maps/yandex-maps-render-service";
import type {
  YMapLngLat,
  YMapMapUpdateEvent,
  YMaps3MapInstance,
} from "@/shared/lib/yandex-maps/ymaps3";

export type YandexMapCanvasProps = {
  apiKey: string;
  /** Долгота и широта (API 3.0). */
  center?: YMapLngLat;
  zoom?: number;
  /** Высота блока (число = px). Для полноэкранной карты задайте `"100%"` и выдайте родителю высоту. */
  height?: number | string;
  /** Пример DOM-маркеров (чипы на карте). */
  overlayMarkers?: YandexMapOverlayMarker[];
  /** Клик по маркеру с полем {@link YandexMapOverlayMarker.id}. */
  onOverlayMarkerClick?: (carId: string) => void;
  /** Геозоны в области (полигоны текущей версии). */
  geozones?: GeozoneRead[] | null;
  /** Линия маршрута [lon, lat] по точкам телеметрии. */
  routeLine?: YMapLngLat[] | null;
  /**
   * Текущий видимый bbox после pan/zoom (`YMapListener` `onUpdate`).
   * Родитель может дебаунсить сетевые запросы.
   */
  onMapViewportBoundsChange?: (bbox: GeozoneBoundingBoxQuery) => void;
};

/**
 * Низкоуровневый блок: контейнер + загрузка API и монтаж карты через {@link yandexMapsRenderService}.
 * Схема и маркеры разделены: смена маркеров не пересоздаёт карту (нет гонок при подгрузке машин).
 */
const YandexMapCanvas = ({
  apiKey,
  center,
  zoom,
  height = 420,
  overlayMarkers,
  onOverlayMarkerClick,
  geozones,
  routeLine,
  onMapViewportBoundsChange,
}: YandexMapCanvasProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<YMaps3MapInstance | null>(null);
  const mapDestroyRef = useRef<(() => void) | null>(null);
  const featuresLayerDetachRef = useRef<(() => void) | null>(null);
  const markersControllerRef = useRef<OverlayMarkersController | null>(null);
  const geozonePolygonsRef = useRef<ReturnType<
    typeof createGeozonePolygonsController
  > | null>(null);
  const routePolylineRef = useRef<TripRoutePolylineController | null>(null);
  const markerClickRef = useRef<typeof onOverlayMarkerClick | undefined>(
    undefined,
  );
  markerClickRef.current = onOverlayMarkerClick;

  const viewportBoundsCbRef = useRef<
    typeof onMapViewportBoundsChange | undefined
  >(undefined);
  viewportBoundsCbRef.current = onMapViewportBoundsChange;

  const [mapReady, setMapReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const centerLng = center?.[0];
  const centerLat = center?.[1];

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !apiKey.trim()) {
      mapInstanceRef.current = null;
      setMapReady(false);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setMapReady(false);
    setLoading(true);
    setError(null);

    markersControllerRef.current?.destroy();
    markersControllerRef.current = null;
    geozonePolygonsRef.current?.destroy();
    geozonePolygonsRef.current = null;
    routePolylineRef.current?.destroy();
    routePolylineRef.current = null;
    featuresLayerDetachRef.current?.();
    featuresLayerDetachRef.current = null;
    mapDestroyRef.current?.();
    mapDestroyRef.current = null;
    mapInstanceRef.current = null;

    void (async () => {
      try {
        const resolvedCenter: YMapLngLat =
          centerLng !== undefined && centerLat !== undefined
            ? [centerLng, centerLat]
            : DEFAULT_MAP_CENTER;

        const handle = await yandexMapsRenderService.mountSchemeMapOnlyAsync(
          apiKey,
          el,
          {
            center: resolvedCenter,
            zoom: zoom ?? DEFAULT_MAP_ZOOM,
          },
        );

        if (cancelled) {
          handle.destroy();
          return;
        }

        mapInstanceRef.current = handle.map;
        mapDestroyRef.current = handle.destroy;
        /** Единственный слой векторных объектов на карту: общий для геозон и маршрута. */
        featuresLayerDetachRef.current = attachDefaultFeaturesLayer(handle.map);
        geozonePolygonsRef.current = createGeozonePolygonsController(
          handle.map,
        );
        routePolylineRef.current = createTripRoutePolylineController(
          handle.map,
        );
        markersControllerRef.current = createOverlayMarkersController(
          handle.map,
          {
            resolveMarkerClick: () => markerClickRef.current,
          },
        );

        const ListenerCtor = window.ymaps3?.YMapListener;
        if (ListenerCtor && viewportBoundsCbRef.current) {
          const viewportListener = new ListenerCtor({
            layer: "any",
            onUpdate: (event: YMapMapUpdateEvent) => {
              const q = ymapsBoundsToGeozoneQuery(event.location?.bounds);
              if (q) {
                viewportBoundsCbRef.current?.(q);
              }
            },
          });
          handle.map.addChild(viewportListener);
        }

        setMapReady(true);
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof Error
              ? e.message
              : translate(LANG_KEYS.map.canvasLoadFailed),
          );
        }
      } finally {
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      setMapReady(false);
      markersControllerRef.current?.destroy();
      markersControllerRef.current = null;
      geozonePolygonsRef.current?.destroy();
      geozonePolygonsRef.current = null;
      routePolylineRef.current?.destroy();
      routePolylineRef.current = null;
      featuresLayerDetachRef.current?.();
      featuresLayerDetachRef.current = null;
      mapDestroyRef.current?.();
      mapDestroyRef.current = null;
      mapInstanceRef.current = null;
    };
  }, [apiKey]);

  useEffect(() => {
    if (!mapReady) {
      return;
    }
    const map = mapInstanceRef.current;
    if (!map || typeof map.setLocation !== "function") {
      return;
    }
    if (centerLng === undefined || centerLat === undefined) {
      if (zoom !== undefined) {
        map.setLocation({ zoom });
      }
      return;
    }
    map.setLocation({
      center: [centerLng, centerLat],
      ...(zoom !== undefined ? { zoom } : {}),
    });
  }, [mapReady, centerLng, centerLat, zoom]);

  useEffect(() => {
    if (!mapReady) {
      return;
    }
    geozonePolygonsRef.current?.setGeozones(geozones ?? undefined);
  }, [mapReady, geozones]);

  useEffect(() => {
    if (!mapReady) {
      return;
    }
    routePolylineRef.current?.setRoute(routeLine ?? undefined);
  }, [mapReady, routeLine]);

  useEffect(() => {
    if (!mapReady) {
      return;
    }
    markersControllerRef.current?.setMarkers(overlayMarkers);
  }, [mapReady, overlayMarkers]);

  const h = typeof height === "number" ? `${height}px` : height;

  return (
    <Stack gap={0} style={{ position: "relative", width: "100%", height: h }}>
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />

      {loading ? (
        <Center
          pos="absolute"
          inset={0}
          bg="var(--mantine-color-body)"
          style={{ opacity: 0.85, pointerEvents: "none" }}
        >
          <Loader size="md" />
        </Center>
      ) : null}

      {error ? (
        <Center pos="absolute" inset={0} p="md" bg="var(--mantine-color-body)">
          <Text size="sm" c="dimmed" ta="center">
            {error}
          </Text>
        </Center>
      ) : null}
    </Stack>
  );
};
YandexMapCanvas.displayName = "YandexMapCanvas";

export { YandexMapCanvas };
