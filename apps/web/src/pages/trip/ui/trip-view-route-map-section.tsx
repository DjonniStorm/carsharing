import { Group, Loader, Paper, Stack, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";

import type { GeozoneRead } from "@/entities/geozone";
import type { TelemetryPointRead } from "@/entities/trip";
import { LANG_KEYS } from "@/shared/i18n/keys";

import { TripHistoryRouteMap } from "@/pages/trip/ui/trip-history-route-map";

type Props = {
  apiKey: string;
  points: TelemetryPointRead[];
  tripGeozone: GeozoneRead | null;
  zoneLoading: boolean;
};

export function TripViewRouteMapSection({
  apiKey,
  points,
  tripGeozone,
  zoneLoading,
}: Props) {
  const { t } = useTranslation();

  return (
    <Paper p="md" radius="md" withBorder>
      <Stack gap="sm">
        <Text size="sm" fw={700} tt="uppercase" c="dimmed">
          {t(LANG_KEYS.pages.tripDetailSectionTelemetry)}
        </Text>
        {zoneLoading ? (
          <Group gap="xs">
            <Loader size="sm" />
            <Text size="sm" c="dimmed">
              {t(LANG_KEYS.pages.tripDetailMapZoneLoading)}
            </Text>
          </Group>
        ) : null}
        <TripHistoryRouteMap
          apiKey={apiKey}
          points={points}
          tripGeozone={tripGeozone}
        />
      </Stack>
    </Paper>
  );
}
