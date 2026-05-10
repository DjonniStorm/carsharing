import {
  Alert,
  Box,
  Checkbox,
  Group,
  Loader,
  Paper,
  Stack,
  Text,
} from "@mantine/core";
import { useAction, useAtom } from "@reatom/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { carToMapMarkerWithLive } from "@/entities/car";
import { GeozoneType } from "@/entities/geozone";
import type { GeozoneBoundingBoxQuery } from "@/features/geozones/api";
import {
  carsListAtom,
  carsListErrorAtom,
  loadCarsList,
} from "@/features/cars/model/cars-list";
import { liveCarPositionsAtom } from "@/features/trip-realtime/model/live-car-positions";
import {
  dashboardGeozonesAtom,
  dashboardGeozonesErrorAtom,
  dashboardGeozonesStatusAtom,
  loadDashboardGeozonesForBBox,
  resetDashboardGeozonesState,
} from "@/features/geozones/model/geozones-state";
import { getYandexMapsApiKey } from "@/shared/config/env";
import {
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_GEOZONE_BOUNDS,
  DEFAULT_MAP_ZOOM,
} from "@/shared/config/map-defaults";
import { LANG_KEYS } from "@/shared/i18n/keys";

import {
  DashboardSelectedCarPanel,
  panelWidth,
  stripWidth,
} from "@/pages/dashboard/ui/dashboard-selected-car-panel";
import { YandexMapPlain } from "@/widgets/yandex-map";

/** Как `header={{ height: 56 }}` у {@link DashboardShell}. */
const APP_SHELL_HEADER_PX = 56;

const OVERLAY_EDGE_PX = 16;

/** После pan/zoom перезапрос геозон по видимому bbox. */
const GEOZONE_VIEWPORT_DEBOUNCE_MS = 1000;

const apiKey = getYandexMapsApiKey();

const LegendRow = ({ color, label }: { color: string; label: string }) => {
  return (
    <Group gap={8} wrap="nowrap">
      <Box
        style={{
          width: 8,
          height: 8,
          borderRadius: 999,
          background: color,
          flexShrink: 0,
        }}
      />
      <Text size="sm">{label}</Text>
    </Group>
  );
};
LegendRow.displayName = "LegendRow";

const DashboardPage = () => {
  const { t } = useTranslation();
  const [cars] = useAtom(carsListAtom);
  const [livePositions] = useAtom(liveCarPositionsAtom);
  const [carsError] = useAtom(carsListErrorAtom);
  const [geozones] = useAtom(dashboardGeozonesAtom);
  const [geozonesError] = useAtom(dashboardGeozonesErrorAtom);
  const [geozonesLoadStatus] = useAtom(dashboardGeozonesStatusAtom);

  const [showRentalGeozones, setShowRentalGeozones] = useState(true);
  const [showParkingGeozones, setShowParkingGeozones] = useState(true);
  const [selectedCarId, setSelectedCarId] = useState<string | null>(null);
  const [carPanelExpanded, setCarPanelExpanded] = useState(true);

  const viewportBBoxRef = useRef<GeozoneBoundingBoxQuery | null>(null);
  const viewportDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const showRentalRef = useRef(showRentalGeozones);
  const showParkingRef = useRef(showParkingGeozones);
  showRentalRef.current = showRentalGeozones;
  showParkingRef.current = showParkingGeozones;

  const loadCars = useAction(loadCarsList);
  const loadGeozonesBBox = useAction(loadDashboardGeozonesForBBox);
  const resetDashboardGeozones = useAction(resetDashboardGeozonesState);

  useEffect(() => {
    void loadCars(false);
  }, [loadCars]);

  const fetchGeozonesForCurrentFilters = useCallback(() => {
    if (!showRentalRef.current && !showParkingRef.current) {
      resetDashboardGeozones();
      return;
    }
    const types: GeozoneType[] = [];
    if (showRentalRef.current) {
      types.push(GeozoneType.RENTAL);
    }
    if (showParkingRef.current) {
      types.push(GeozoneType.PARKING);
    }
    const bbox = viewportBBoxRef.current ?? DEFAULT_MAP_GEOZONE_BOUNDS;
    void loadGeozonesBBox({
      ...bbox,
      types,
    });
  }, [loadGeozonesBBox, resetDashboardGeozones]);

  const scheduleFetchAfterViewportMove = useCallback(() => {
    if (viewportDebounceRef.current) {
      clearTimeout(viewportDebounceRef.current);
    }
    viewportDebounceRef.current = setTimeout(() => {
      viewportDebounceRef.current = null;
      fetchGeozonesForCurrentFilters();
    }, GEOZONE_VIEWPORT_DEBOUNCE_MS);
  }, [fetchGeozonesForCurrentFilters]);

  const handleMapViewportBounds = useCallback(
    (bbox: GeozoneBoundingBoxQuery) => {
      viewportBBoxRef.current = bbox;
      scheduleFetchAfterViewportMove();
    },
    [scheduleFetchAfterViewportMove],
  );

  useEffect(() => {
    if (viewportDebounceRef.current) {
      clearTimeout(viewportDebounceRef.current);
      viewportDebounceRef.current = null;
    }
    fetchGeozonesForCurrentFilters();
  }, [showRentalGeozones, showParkingGeozones, fetchGeozonesForCurrentFilters]);

  useEffect(() => {
    return () => {
      if (viewportDebounceRef.current) {
        clearTimeout(viewportDebounceRef.current);
      }
    };
  }, []);

  const overlayRightPx = useMemo(() => {
    if (!selectedCarId) {
      return OVERLAY_EDGE_PX;
    }
    return OVERLAY_EDGE_PX + (carPanelExpanded ? panelWidth : stripWidth);
  }, [selectedCarId, carPanelExpanded]);

  const overlayMarkers = useMemo(() => {
    if (!cars?.length) {
      return undefined;
    }
    return cars
      .map((car) => {
        return carToMapMarkerWithLive(car, livePositions[car.id]);
      })
      .filter((m): m is NonNullable<typeof m> => m !== null);
  }, [cars, livePositions]);

  return (
    <Box
      style={{
        width: "100%",
        height: `calc(100dvh - ${APP_SHELL_HEADER_PX}px)`,
        position: "relative",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {!apiKey.trim() ? (
        <Alert m="md" color="yellow" title={t(LANG_KEYS.map.noApiKeyTitle)}>
          {t(LANG_KEYS.map.noApiKeyBody)}
        </Alert>
      ) : (
        <>
          {carsError ? (
            <Alert m="md" color="red" title={t(LANG_KEYS.pages.carsTitle)}>
              {carsError}
            </Alert>
          ) : null}
          {geozonesError ? (
            <Alert m="md" color="orange">
              {geozonesError}
            </Alert>
          ) : null}
          <Box
            style={{
              flex: 1,
              minHeight: 0,
              position: "relative",
              width: "100%",
            }}
          >
            <YandexMapPlain
              apiKey={apiKey}
              center={DEFAULT_MAP_CENTER}
              zoom={DEFAULT_MAP_ZOOM}
              height="100%"
              overlayMarkers={overlayMarkers}
              geozones={geozones ?? undefined}
              onMapViewportBoundsChange={handleMapViewportBounds}
              onOverlayMarkerClick={(carId) => {
                setSelectedCarId(carId);
                setCarPanelExpanded(true);
              }}
            />

            <Paper
              shadow="md"
              p="sm"
              radius="md"
              withBorder
              style={{
                position: "absolute",
                left: OVERLAY_EDGE_PX,
                bottom: OVERLAY_EDGE_PX,
                zIndex: 2,
                pointerEvents: "auto",
                maxWidth: 280,
              }}
            >
              <Stack gap="sm">
                <Checkbox
                  size="sm"
                  label={t(LANG_KEYS.pages.geozonesTypeRental)}
                  checked={showRentalGeozones}
                  onChange={(e) => {
                    setShowRentalGeozones(e.currentTarget.checked);
                  }}
                />
                <Checkbox
                  size="sm"
                  label={t(LANG_KEYS.pages.geozonesTypeParking)}
                  checked={showParkingGeozones}
                  onChange={(e) => {
                    setShowParkingGeozones(e.currentTarget.checked);
                  }}
                />
                {geozonesLoadStatus === "loading" ? (
                  <Group gap={8} wrap="nowrap">
                    <Loader size="xs" />
                    <Text size="xs" c="dimmed">
                      {t(LANG_KEYS.pages.dashboardGeozonesLoadingShort)}
                    </Text>
                  </Group>
                ) : null}
              </Stack>
            </Paper>

            <Paper
              shadow="md"
              p="sm"
              radius="md"
              withBorder
              style={{
                position: "absolute",
                right: overlayRightPx,
                bottom: OVERLAY_EDGE_PX,
                maxWidth: 240,
                zIndex: 2,
                pointerEvents: "none",
              }}
            >
              <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb="xs">
                {t(LANG_KEYS.map.legendTitle)}
              </Text>
              <Stack gap={6}>
                <LegendRow
                  color="#22c55e"
                  label={t(LANG_KEYS.map.legendAvailable)}
                />
                <LegendRow
                  color="#228be6"
                  label={t(LANG_KEYS.map.legendInUse)}
                />
                <LegendRow
                  color="#adb5bd"
                  label={t(LANG_KEYS.map.legendOffline)}
                />
              </Stack>
            </Paper>

            <DashboardSelectedCarPanel
              carId={selectedCarId}
              expanded={carPanelExpanded}
              onExpandedChange={setCarPanelExpanded}
              onClearSelection={() => {
                setSelectedCarId(null);
              }}
            />
          </Box>
        </>
      )}
    </Box>
  );
};
DashboardPage.displayName = "DashboardPage";

export { DashboardPage };
