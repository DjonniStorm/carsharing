import {
  Alert,
  Box,
  Center,
  Group,
  Loader,
  MultiSelect,
  Paper,
  ScrollArea,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { useAction, useAtom } from "@reatom/react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { carToMapMarker } from "@/entities/car";
import { GeozoneType } from "@/entities/geozone";
import {
  carsListAtom,
  carsListErrorAtom,
  loadCarsList,
} from "@/features/cars/model/cars-list";
import {
  GEOZONE_TYPES_ORDERED,
  geozoneTypeLangKey,
} from "@/features/geozones/lib/geozone-type-present";
import {
  dashboardGeozonesAtom,
  dashboardGeozonesErrorAtom,
  dashboardGeozonesStatusAtom,
  loadDashboardGeozonesForBBox,
} from "@/features/geozones/model/geozones-state";
import { getYandexMapsApiKey } from "@/shared/config/env";
import {
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_GEOZONE_BOUNDS,
  DEFAULT_MAP_ZOOM,
} from "@/shared/config/map-defaults";
import { LANG_KEYS } from "@/shared/i18n/keys";

import { YandexMapPlain } from "@/widgets/yandex-map";

/** Как `header={{ height: 56 }}` у {@link DashboardShell}. */
const APP_SHELL_HEADER_PX = 56;

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
  const [carsError] = useAtom(carsListErrorAtom);
  const [geozones] = useAtom(dashboardGeozonesAtom);
  const [geozonesError] = useAtom(dashboardGeozonesErrorAtom);
  const [geozonesLoadStatus] = useAtom(dashboardGeozonesStatusAtom);

  const [nameQuery, setNameQuery] = useState("");
  const [debouncedName] = useDebouncedValue(nameQuery, 220);
  const [typeFilter, setTypeFilter] = useState<GeozoneType[]>([]);

  const loadCars = useAction(loadCarsList);
  const loadGeozonesBBox = useAction(loadDashboardGeozonesForBBox);

  useEffect(() => {
    void loadCars(false);
  }, [loadCars]);

  useEffect(() => {
    void loadGeozonesBBox({
      ...DEFAULT_MAP_GEOZONE_BOUNDS,
      types: typeFilter.length ? typeFilter : undefined,
    });
  }, [loadGeozonesBBox, typeFilter]);

  const overlayMarkers = useMemo(() => {
    if (!cars?.length) {
      return undefined;
    }
    return cars
      .map(carToMapMarker)
      .filter((m): m is NonNullable<typeof m> => m !== null);
  }, [cars]);

  const typeSelectData = useMemo(() => {
    return GEOZONE_TYPES_ORDERED.map((gt) => ({
      value: gt,
      label: t(geozoneTypeLangKey(gt)),
    }));
  }, [t]);

  const geozonesFilteredByName = useMemo(() => {
    const list = geozones ?? [];
    const q = debouncedName.trim().toLowerCase();
    if (!q) {
      return list;
    }
    return list.filter((g) => g.name.toLowerCase().includes(q));
  }, [geozones, debouncedName]);

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
            />

            <Paper
              shadow="md"
              p="sm"
              radius="md"
              withBorder
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                width: "min(320px, calc(100% - 32px))",
                maxHeight: "min(360px, 42vh)",
                zIndex: 2,
                display: "flex",
                flexDirection: "column",
                gap: 8,
                pointerEvents: "auto",
              }}
            >
              <Text size="xs" fw={700} tt="uppercase" c="dimmed">
                {t(LANG_KEYS.pages.dashboardGeozonesPanelTitle)}
              </Text>
              <TextInput
                size="xs"
                placeholder={t(
                  LANG_KEYS.pages.dashboardGeozonesSearchPlaceholder,
                )}
                value={nameQuery}
                onChange={(e) => {
                  setNameQuery(e.currentTarget.value);
                }}
              />
              <MultiSelect
                size="xs"
                label={t(LANG_KEYS.pages.dashboardGeozonesTypesLabel)}
                placeholder={t(
                  LANG_KEYS.pages.dashboardGeozonesTypesPlaceholder,
                )}
                clearable
                data={typeSelectData}
                value={typeFilter}
                onChange={(v) => {
                  setTypeFilter(v as GeozoneType[]);
                }}
              />
              {geozonesLoadStatus === "loading" ? (
                <Center py="xs">
                  <Group gap={8}>
                    <Loader size="xs" />
                    <Text size="xs" c="dimmed">
                      {t(LANG_KEYS.pages.dashboardGeozonesLoadingShort)}
                    </Text>
                  </Group>
                </Center>
              ) : geozonesFilteredByName.length === 0 ? (
                <Text size="xs" c="dimmed">
                  {t(LANG_KEYS.pages.dashboardGeozonesEmptyList)}
                </Text>
              ) : (
                <ScrollArea.Autosize mah={200} type="auto">
                  <Stack gap={6}>
                    {geozonesFilteredByName.map((g) => (
                      <Group key={g.id} gap={8} wrap="nowrap" align="flex-start">
                        <Box
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: 4,
                            background: g.color || "var(--mantine-color-gray-5)",
                            flexShrink: 0,
                            marginTop: 3,
                          }}
                        />
                        <Stack gap={2} style={{ minWidth: 0 }}>
                          <Text size="xs" fw={600} truncate="end">
                            {g.name}
                          </Text>
                          <Text size="xs" c="dimmed">
                            {t(geozoneTypeLangKey(g.type))}
                          </Text>
                        </Stack>
                      </Group>
                    ))}
                  </Stack>
                </ScrollArea.Autosize>
              )}
            </Paper>

            <Paper
              shadow="md"
              p="sm"
              radius="md"
              withBorder
              style={{
                position: "absolute",
                left: 16,
                bottom: 16,
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
          </Box>
        </>
      )}
    </Box>
  );
};
DashboardPage.displayName = "DashboardPage";

export { DashboardPage };
