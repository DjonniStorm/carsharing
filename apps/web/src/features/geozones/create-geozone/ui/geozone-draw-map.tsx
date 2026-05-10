import { Center, Loader, Stack, Text } from "@mantine/core";
import { useEffect, useRef, useState } from "react";

import {
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
} from "@/shared/config/map-defaults";
import { LANG_KEYS } from "@/shared/i18n/keys";
import { translate } from "@/shared/i18n/translate";
import {
  attachDefaultFeaturesLayer,
  yandexMapsRenderService,
} from "@/shared/lib/yandex-maps/yandex-maps-render-service";
import type {
  YMapFeatureStyle,
  YMapLngLat,
  YMaps3MapInstance,
} from "@/shared/lib/yandex-maps/ymaps3";

function destroyEntity(entity: unknown): void {
  if (
    entity &&
    typeof entity === "object" &&
    "destroy" in entity &&
    typeof (entity as { destroy: unknown }).destroy === "function"
  ) {
    (entity as { destroy: () => void }).destroy();
  }
}

/** Убирает объект с карты (как в документации YMap: removeChild + при необходимости destroy). */
function detachMapChild(map: YMaps3MapInstance, entity: unknown): void {
  const remove = map.removeChild;
  if (typeof remove === "function") {
    try {
      remove.call(map, entity);
    } catch {
      /* уже не дочерний элемент карты */
    }
  }
  destroyEntity(entity);
}

function hexToPreviewStyles(hex: string): {
  polygon: YMapFeatureStyle;
  line: YMapFeatureStyle;
} {
  const raw = hex.trim().replace(/^#/, "");
  const safe =
    raw.length === 6 && /^[0-9a-fA-F]+$/.test(raw) ? `#${raw}` : "#228be6";
  return {
    polygon: {
      stroke: [{ color: `${safe}DD`, width: 2 }],
      fill: `${safe}33`,
    },
    line: {
      stroke: [{ color: safe, width: 2 }],
    },
  };
}

export type GeozoneDrawMode = "rectangle" | "polygon";

export type GeozoneDrawMapProps = {
  apiKey: string;
  previewColorHex: string;
  drawMode: GeozoneDrawMode;
  polygonVertices: YMapLngLat[];
  closedRing: YMapLngLat[] | null;
  rectangleAnchor: YMapLngLat | null;
  onLngLatClick: (coords: YMapLngLat) => void;
  height?: number | string;
};

/**
 * Карта для черновика геозоны: клики по схеме, превью полигона/ломаной (JS API 3.0).
 */
const GeozoneDrawMap = ({
  apiKey,
  previewColorHex,
  drawMode,
  polygonVertices,
  closedRing,
  rectangleAnchor,
  onLngLatClick,
  height = 420,
}: GeozoneDrawMapProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<YMaps3MapInstance | null>(null);
  const destroyMapRef = useRef<(() => void) | null>(null);
  const previewEntitiesRef = useRef<unknown[]>([]);
  const onClickRef = useRef(onLngLatClick);
  onClickRef.current = onLngLatClick;

  const [mapReady, setMapReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const h = typeof height === "number" ? `${height}px` : height;

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !apiKey.trim()) {
      mapRef.current = null;
      setMapReady(false);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setMapReady(false);
    setLoading(true);
    setError(null);

    destroyMapRef.current?.();
    destroyMapRef.current = null;
    mapRef.current = null;

    void (async () => {
      try {
        const handle = await yandexMapsRenderService.mountSchemeMapOnlyAsync(
          apiKey,
          el,
          {
            center: DEFAULT_MAP_CENTER,
            zoom: DEFAULT_MAP_ZOOM,
          },
        );

        if (cancelled) {
          handle.destroy();
          return;
        }

        mapRef.current = handle.map;
        destroyMapRef.current = handle.destroy;
        attachDefaultFeaturesLayer(handle.map);

        const ymaps3 = window.ymaps3;
        const Listener = ymaps3?.YMapListener;
        if (Listener) {
          handle.map.addChild(
            new Listener({
              onClick: (
                _object: unknown,
                event: { coordinates?: YMapLngLat },
              ) => {
                const c = event?.coordinates;
                if (!c || c.length < 2) {
                  return;
                }
                onClickRef.current([c[0], c[1]]);
              },
            }),
          );
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
      const mapSnapshot = mapRef.current;
      if (mapSnapshot) {
        for (const entity of previewEntitiesRef.current) {
          detachMapChild(mapSnapshot, entity);
        }
      } else {
        for (const entity of previewEntitiesRef.current) {
          destroyEntity(entity);
        }
      }
      previewEntitiesRef.current = [];
      destroyMapRef.current?.();
      destroyMapRef.current = null;
      mapRef.current = null;
    };
  }, [apiKey]);

  useEffect(() => {
    if (!mapReady) {
      return;
    }
    const map = mapRef.current;
    if (!map) {
      return;
    }

    for (const entity of previewEntitiesRef.current) {
      detachMapChild(map, entity);
    }
    previewEntitiesRef.current = [];

    const ymaps3 = window.ymaps3;
    const YMapFeature = ymaps3?.YMapFeature;
    const YMapMarker = ymaps3?.YMapMarker;
    if (!YMapFeature) {
      return;
    }

    const styles = hexToPreviewStyles(previewColorHex);

    const push = (entity: unknown) => {
      map.addChild(entity);
      previewEntitiesRef.current.push(entity);
    };

    if (closedRing && closedRing.length >= 4) {
      push(
        new YMapFeature({
          geometry: { type: "Polygon", coordinates: [closedRing] },
          style: styles.polygon,
        }),
      );
    }

    if (drawMode === "polygon" && polygonVertices.length >= 2 && !closedRing) {
      push(
        new YMapFeature({
          geometry: { type: "LineString", coordinates: polygonVertices },
          style: styles.line,
        }),
      );
    }

    if (drawMode === "rectangle" && rectangleAnchor && !closedRing) {
      if (YMapMarker) {
        const dot = document.createElement("div");
        dot.style.cssText = [
          "width:12px",
          "height:12px",
          "border-radius:50%",
          "background:#ffffff",
          "border:2px solid var(--mantine-color-blue-6)",
          "box-shadow:0 1px 4px rgba(0,0,0,0.2)",
        ].join(";");
        push(new YMapMarker({ coordinates: rectangleAnchor }, dot));
      }
    }

    if (
      drawMode === "polygon" &&
      polygonVertices.length > 0 &&
      !closedRing &&
      YMapMarker
    ) {
      for (const p of polygonVertices) {
        const dot = document.createElement("div");
        dot.style.cssText = [
          "width:10px",
          "height:10px",
          "border-radius:50%",
          "background:#ffffff",
          "border:2px solid var(--mantine-color-blue-6)",
        ].join(";");
        push(new YMapMarker({ coordinates: p }, dot));
      }
    }

    return () => {
      const m = mapRef.current;
      if (m) {
        for (const entity of previewEntitiesRef.current) {
          detachMapChild(m, entity);
        }
      } else {
        for (const entity of previewEntitiesRef.current) {
          destroyEntity(entity);
        }
      }
      previewEntitiesRef.current = [];
    };
  }, [
    mapReady,
    previewColorHex,
    drawMode,
    polygonVertices,
    closedRing,
    rectangleAnchor,
  ]);

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
GeozoneDrawMap.displayName = "GeozoneDrawMap";

export { GeozoneDrawMap };
