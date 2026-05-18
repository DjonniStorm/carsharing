import { Button, Divider, Stack, Text } from "@mantine/core";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import type { ReadUser } from "@/entities/user";
import type { TripRead } from "@/entities/trip";
import { tripStatusLangKey } from "@/features/trips/lib/trip-status-lang-key";
import { ROUTES } from "@/shared/config/routes-paths";
import { formatMoney, formatTripDistanceKm } from "@/shared/lib/format";
import { LANG_KEYS } from "@/shared/i18n/keys";

type Props = {
  liveOngoingTrip: TripRead | null;
  driver: ReadUser | null;
  violationsCount: number | null;
};

export function DashboardCarTripBlock({
  liveOngoingTrip,
  driver,
  violationsCount,
}: Props) {
  const { t } = useTranslation();

  return (
    <>
      <Stack gap={4}>
        <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
          {t(LANG_KEYS.pages.dashboardCarPanelSectionTrip)}
        </Text>
        {liveOngoingTrip ? (
          <>
            <Text size="xs" c="dimmed">
              {t(LANG_KEYS.pages.dashboardCarPanelTripStatus)}{" "}
              <Text span fw={600} c="var(--mantine-color-text)">
                {t(tripStatusLangKey(liveOngoingTrip.status))}
              </Text>
            </Text>
            <Text size="xs" c="dimmed">
              {t(LANG_KEYS.pages.dashboardCarPanelTripStarted)}{" "}
              <Text span fw={600} c="var(--mantine-color-text)">
                {new Date(liveOngoingTrip.startedAt).toLocaleString()}
              </Text>
            </Text>
            <Text size="xs" c="dimmed">
              {t(LANG_KEYS.pages.dashboardCarPanelTripDistance)}{" "}
              <Text span fw={600} c="var(--mantine-color-text)">
                {formatTripDistanceKm(
                  liveOngoingTrip.distanceMeters,
                  liveOngoingTrip.distance,
                )}{" "}
                km
              </Text>
            </Text>
            <Text size="xs" c="dimmed">
              {t(LANG_KEYS.pages.dashboardCarPanelTripPrice)}{" "}
              <Text span fw={600} c="var(--mantine-color-text)">
                {liveOngoingTrip.priceTotal != null
                  ? formatMoney(liveOngoingTrip.priceTotal, {
                      currency: "RUB",
                    })
                  : t(LANG_KEYS.pages.tripDetailPriceCalculating)}
              </Text>
            </Text>
            {violationsCount !== null ? (
              <Text size="xs" c="dimmed">
                {t(LANG_KEYS.pages.dashboardCarPanelViolations)}{" "}
                <Text span fw={600} c="var(--mantine-color-text)">
                  {violationsCount}
                </Text>
              </Text>
            ) : null}
          </>
        ) : (
          <Text size="sm" c="dimmed">
            {t(LANG_KEYS.pages.dashboardCarPanelNoTrip)}
          </Text>
        )}
      </Stack>

      <Divider />

      <Stack gap={4}>
        <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
          {t(LANG_KEYS.pages.dashboardCarPanelSectionDriver)}
        </Text>
        {driver ? (
          <Text size="sm" fw={600}>
            {driver.name}
          </Text>
        ) : liveOngoingTrip ? (
          <Text size="xs" c="dimmed">
            {t(LANG_KEYS.pages.dashboardCarPanelDriverFallback)}
          </Text>
        ) : (
          <Text size="xs" c="dimmed">
            {t(LANG_KEYS.pages.dashboardCarPanelNoDriverTrip)}
          </Text>
        )}
      </Stack>

      <Stack gap="xs" mt="xs">
        <Button
          component={Link}
          to={ROUTES.dashboard.cars}
          size="xs"
          variant="light"
          fullWidth
        >
          {t(LANG_KEYS.pages.dashboardCarPanelGoCars)}
        </Button>
        {liveOngoingTrip ? (
          <>
            <Button
              component={Link}
              to={ROUTES.dashboard.tripView(liveOngoingTrip.id)}
              size="xs"
              variant="light"
              fullWidth
            >
              {t(LANG_KEYS.pages.dashboardCarPanelGoTrip)}
            </Button>
            <Button
              component={Link}
              to={ROUTES.dashboard.userView(liveOngoingTrip.userId)}
              size="xs"
              variant="light"
              fullWidth
            >
              {t(LANG_KEYS.pages.dashboardCarPanelGoUser)}
            </Button>
          </>
        ) : null}
      </Stack>
    </>
  );
}
