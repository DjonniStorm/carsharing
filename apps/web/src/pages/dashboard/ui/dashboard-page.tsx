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
import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { carToMapMarkerWithLive } from "@/entities/car";
import {
  carsListAtom,
  carsListErrorAtom,
  loadCarsList,
} from "@/features/cars/model/cars-list";
import { liveCarPositionsAtom } from "@/features/trip-realtime/model/live-car-positions";
import { getYandexMapsApiKey } from "@/shared/config/env";
import {
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
} from "@/shared/config/map-defaults";
import { LANG_KEYS } from "@/shared/i18n/keys";

import { useDashboardCarSelection } from "@/pages/dashboard/hooks/use-dashboard-car-selection";
import { useDashboardMapViewport } from "@/pages/dashboard/hooks/use-dashboard-map-viewport";
import { DashboardSelectedCarPanel } from "@/pages/dashboard/ui/dashboard-selected-car-panel";
import { YandexMapPlain } from "@/widgets/yandex-map";

const APP_SHELL_HEADER_PX = 56;

const OVERLAY_EDGE_PX = 16;

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
  const loadCars = useAction(loadCarsList);

  const mapViewport = useDashboardMapViewport();
  const selection = useDashboardCarSelection();

  useEffect(() => {
    void loadCars(false);
  }, [loadCars]);

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
          {mapViewport.geozonesError ? (
            <Alert m="md" color="orange">
              {mapViewport.geozonesError}
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
              geozones={mapViewport.geozones ?? undefined}
              onMapViewportBoundsChange={mapViewport.handleMapViewportBounds}
              onOverlayMarkerClick={selection.selectCar}
            />

            <Paper
              shadow="md"
              p="sm"
              radius="md"
              withBorder
              style={{
                position: "absolute",
                left: OVERLAY_EDGE_PX,
                top: OVERLAY_EDGE_PX,
                zIndex: 2,
                pointerEvents: "auto",
                maxWidth: 280,
              }}
            >
              <Stack gap="sm">
                <Checkbox
                  size="sm"
                  label={t(LANG_KEYS.pages.geozonesTypeRental)}
                  checked={mapViewport.showRentalGeozones}
                  onChange={(e) => {
                    mapViewport.setShowRentalGeozones(e.currentTarget.checked);
                  }}
                />
                <Checkbox
                  size="sm"
                  label={t(LANG_KEYS.pages.geozonesTypeParking)}
                  checked={mapViewport.showParkingGeozones}
                  onChange={(e) => {
                    mapViewport.setShowParkingGeozones(e.currentTarget.checked);
                  }}
                />
                {mapViewport.geozonesLoadStatus === "loading" ? (
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
                right: selection.overlayRightPx,
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
              carId={selection.selectedCarId}
              expanded={selection.carPanelExpanded}
              onExpandedChange={selection.setCarPanelExpanded}
              onClearSelection={selection.clearSelection}
            />
          </Box>
        </>
      )}
    </Box>
  );
};
DashboardPage.displayName = "DashboardPage";

export { DashboardPage };
