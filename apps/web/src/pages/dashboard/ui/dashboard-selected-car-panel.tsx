import {
  ActionIcon,
  Box,
  Button,
  Divider,
  Group,
  Loader,
  ScrollArea,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { Link } from "@tanstack/react-router";
import { useAction } from "@reatom/react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import type { CarRead } from "@/entities/car";
import type { ReadUser } from "@/entities/user";
import { carsApi } from "@/features/cars/api";
import { pickOngoingTrip } from "@/features/dashboard/lib/pick-ongoing-trip";
import { useLiveTrip } from "@/features/trip-realtime/hooks/use-live-trip";
import {
  registerTripWatch,
  unregisterTripWatch,
} from "@/features/trip-realtime/model/live-trip-overlay";
import { tripStatusLangKey } from "@/features/trips/lib/trip-status-lang-key";
import { tripsApi } from "@/features/trips/api";
import { usersApi } from "@/features/auth/api";
import {
  CAR_STATUSES_ORDERED,
  carStatusLangKey,
} from "@/features/cars/lib/car-status-present";
import { violationsApi } from "@/features/violations/api";
import type { TripRead } from "@/entities/trip";
import { LANG_KEYS } from "@/shared/i18n/keys";
import { ROUTES } from "@/shared/config/routes-paths";
import { formatMoney, formatTripDistanceKm } from "@/shared/lib/format";
import { isOngoingTripStatus } from "@/shared/lib/is-ongoing-trip-status";

type Props = {
  carId: string | null;
  /** Показывать широкую панель с контентом; при `false` — узкая полоска «развернуть». */
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  onClearSelection: () => void;
};

type PanelState = {
  car: CarRead | null;
  ongoingTrip: TripRead | null;
  driver: ReadUser | null;
  violationsCount: number | null;
};

const stripWidth = 40;
const panelWidth = 300;

const DashboardSelectedCarPanel = ({
  carId,
  expanded,
  onExpandedChange,
  onClearSelection,
}: Props) => {
  const { t } = useTranslation();
  const watchTrip = useAction(registerTripWatch);
  const unwatchTrip = useAction(unregisterTripWatch);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PanelState>({
    car: null,
    ongoingTrip: null,
    driver: null,
    violationsCount: null,
  });

  useEffect(() => {
    if (!carId) {
      setData({
        car: null,
        ongoingTrip: null,
        driver: null,
        violationsCount: null,
      });
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    void (async () => {
      try {
        const car = await carsApi.findById(carId);
        const trips = await tripsApi.findAll({ carId });
        const ongoingTrip = pickOngoingTrip(trips);

        let driver: ReadUser | null = null;
        let violationsCount: number | null = null;
        if (ongoingTrip) {
          try {
            driver = await usersApi.findById(ongoingTrip.userId);
          } catch {
            driver = null;
          }
          try {
            const viol = await violationsApi.findByTripId(ongoingTrip.id);
            violationsCount = viol.length;
          } catch {
            violationsCount = null;
          }
        }

        if (!cancelled) {
          setData({ car, ongoingTrip, driver, violationsCount });
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
          setData({
            car: null,
            ongoingTrip: null,
            driver: null,
            violationsCount: null,
          });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [carId]);

  const ongoingTrip = data.ongoingTrip;
  const liveOngoingTrip = useLiveTrip(ongoingTrip) ?? ongoingTrip;

  useEffect(() => {
    if (!ongoingTrip || !isOngoingTripStatus(ongoingTrip.status)) {
      return;
    }
    watchTrip(ongoingTrip.id);
    return () => {
      unwatchTrip(ongoingTrip.id);
    };
  }, [ongoingTrip?.id, ongoingTrip?.status, watchTrip, unwatchTrip]);

  if (!carId) {
    return null;
  }

  const w = expanded ? panelWidth : stripWidth;

  return (
    <Box
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        bottom: 0,
        width: w,
        zIndex: 4,
        display: "flex",
        flexDirection: "row",
        pointerEvents: "auto",
        transition: "width 160ms ease",
        boxShadow: expanded ? "-4px 0 24px rgba(0,0,0,0.08)" : undefined,
        background: "var(--mantine-color-body)",
        borderLeft: "1px solid var(--mantine-color-default-border)",
      }}
    >
      {!expanded ? (
        <Stack
          gap={4}
          justify="flex-start"
          align="center"
          pt="sm"
          style={{ width: stripWidth, flexShrink: 0 }}
        >
          <ActionIcon
            variant="light"
            size="sm"
            aria-label={t(LANG_KEYS.pages.dashboardCarPanelExpand)}
            title={t(LANG_KEYS.pages.dashboardCarPanelExpand)}
            onClick={() => {
              onExpandedChange(true);
            }}
          >
            ‹
          </ActionIcon>
          <Text
            size="10px"
            fw={700}
            c="dimmed"
            style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
          >
            {t(LANG_KEYS.pages.dashboardCarPanelShortTitle)}
          </Text>
        </Stack>
      ) : (
        <Stack
          gap={0}
          style={{
            flex: 1,
            minWidth: 0,
            height: "100%",
          }}
        >
          <Group justify="space-between" p="sm" wrap="nowrap">
            <Title order={5} lineClamp={2} style={{ flex: 1 }}>
              {data.car?.licensePlate ??
                t(LANG_KEYS.pages.dashboardCarPanelTitle)}
            </Title>
            <Group gap={4} wrap="nowrap">
              <ActionIcon
                variant="subtle"
                size="sm"
                aria-label={t(LANG_KEYS.pages.dashboardCarPanelCollapse)}
                title={t(LANG_KEYS.pages.dashboardCarPanelCollapse)}
                onClick={() => {
                  onExpandedChange(false);
                }}
              >
                ›
              </ActionIcon>
              <ActionIcon
                variant="subtle"
                size="sm"
                color="gray"
                aria-label={t(LANG_KEYS.pages.dashboardCarPanelClear)}
                title={t(LANG_KEYS.pages.dashboardCarPanelClear)}
                onClick={() => {
                  onClearSelection();
                }}
              >
                ×
              </ActionIcon>
            </Group>
          </Group>
          <Divider />
          <ScrollArea style={{ flex: 1 }} type="auto" offsetScrollbars>
            <Stack gap="sm" p="sm" pb="xl">
              {loading ? (
                <Group justify="center" py="md">
                  <Loader size="sm" />
                </Group>
              ) : error ? (
                <Text size="sm" c="red">
                  {error}
                </Text>
              ) : data.car ? (
                <>
                  <Stack gap={4}>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                      {t(LANG_KEYS.pages.dashboardCarPanelSectionCar)}
                    </Text>
                    <Text size="sm">
                      {data.car.brand} {data.car.model}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {t(LANG_KEYS.pages.dashboardCarPanelPlate)}{" "}
                      <Text span fw={600} c="var(--mantine-color-text)">
                        {data.car.licensePlate}
                      </Text>
                    </Text>
                    <Text size="xs" c="dimmed">
                      {t(LANG_KEYS.pages.dashboardCarPanelStatus)}{" "}
                      <Text span fw={600} c="var(--mantine-color-text)">
                        {CAR_STATUSES_ORDERED.includes(data.car.carStatus)
                          ? t(carStatusLangKey(data.car.carStatus))
                          : String(data.car.carStatus)}
                      </Text>
                    </Text>
                    <Text size="xs" c="dimmed">
                      {t(LANG_KEYS.pages.dashboardCarPanelFuel)}{" "}
                      <Text span fw={600} c="var(--mantine-color-text)">
                        {data.car.fuelLevel}%
                      </Text>
                    </Text>
                    <Text size="xs" c="dimmed">
                      {t(LANG_KEYS.pages.dashboardCarPanelMileage)}{" "}
                      <Text span fw={600} c="var(--mantine-color-text)">
                        {data.car.mileage}
                      </Text>
                    </Text>
                  </Stack>

                  <Divider />

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
                            {new Date(
                              liveOngoingTrip.startedAt,
                            ).toLocaleString()}
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
                              ? formatMoney(liveOngoingTrip.priceTotal)
                              : t(LANG_KEYS.pages.tripDetailPriceCalculating)}
                          </Text>
                        </Text>
                        {data.violationsCount !== null ? (
                          <Text size="xs" c="dimmed">
                            {t(LANG_KEYS.pages.dashboardCarPanelViolations)}{" "}
                            <Text span fw={600} c="var(--mantine-color-text)">
                              {data.violationsCount}
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
                    {data.driver ? (
                      <Text size="sm" fw={600}>
                        {data.driver.name}
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
                          to={ROUTES.dashboard.userView(
                            liveOngoingTrip.userId,
                          )}
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
              ) : null}
            </Stack>
          </ScrollArea>
        </Stack>
      )}
    </Box>
  );
};
DashboardSelectedCarPanel.displayName = "DashboardSelectedCarPanel";

export { DashboardSelectedCarPanel, panelWidth, stripWidth };
