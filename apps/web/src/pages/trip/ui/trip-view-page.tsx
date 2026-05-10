import {
  Alert,
  Button,
  Container,
  Divider,
  Group,
  Loader,
  Paper,
  ScrollArea,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { useAction, useAtom } from "@reatom/react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import {
  CAR_STATUSES_ORDERED,
  carStatusLangKey,
} from "@/features/cars/lib/car-status-present";
import {
  loadTripGeozoneForMap,
  loadTripHistoryFull,
  resetTripHistoryView,
  tripGeozoneForMapAtom,
  tripGeozoneForMapStatusAtom,
  tripHistoryFullAtom,
  tripHistoryFullErrorAtom,
  tripHistoryFullStatusAtom,
} from "@/features/trips/model/trip-history-view";
import { tripStatusLangKey } from "@/features/trips/lib/trip-status-lang-key";
import { ViolationSummaryCard } from "@/features/violations/ui/violation-summary-card";
import { ROUTES } from "@/shared/config/routes-paths";
import { getYandexMapsApiKey } from "@/shared/config/env";
import { LANG_KEYS } from "@/shared/i18n/keys";

import { TripHistoryRouteMap } from "@/pages/trip/ui/trip-history-route-map";

const tripMapApiKey = getYandexMapsApiKey();

function fmtCoord(lat: number | null, lon: number | null): string {
  if (lat == null || lon == null) {
    return "—";
  }
  return `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
}

function fmtMoney(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(Number(n))) {
    return "—";
  }
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(n));
}

function Row({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  const v =
    value === null || value === undefined || value === "" ? "—" : String(value);
  return (
    <Text size="sm">
      <Text span fw={600}>
        {label}
      </Text>{" "}
      {v}
    </Text>
  );
}

const TripViewPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  /** Родитель — layout с `id: "dashboard-shell"` в router.tsx; см. join id в @tanstack/router-core. */
  const { tripId } = useParams({
    from: "/dashboard-shell/dashboard/trips/$tripId",
  });

  const [data] = useAtom(tripHistoryFullAtom);
  const [status] = useAtom(tripHistoryFullStatusAtom);
  const [errorState] = useAtom(tripHistoryFullErrorAtom);
  const [tripMapGeozone] = useAtom(tripGeozoneForMapAtom);
  const [tripGeozoneStatus] = useAtom(tripGeozoneForMapStatusAtom);

  const loadFull = useAction(loadTripHistoryFull);
  const loadZone = useAction(loadTripGeozoneForMap);
  const resetView = useAction(resetTripHistoryView);

  useEffect(() => {
    resetView();
    void loadFull(tripId);
    return () => {
      resetView();
    };
  }, [tripId, loadFull, resetView]);

  const versionId = data?.trip?.geoZoneVersionId;
  useEffect(() => {
    void loadZone(versionId);
  }, [versionId, loadZone]);

  useEffect(() => {
    if (!errorState?.status) {
      return;
    }
    if (errorState.status === 404) {
      void navigate({
        to: ROUTES.error,
        replace: true,
        search: { reason: "trip_not_found" },
      });
    } else if (errorState.status === 403) {
      void navigate({
        to: ROUTES.error,
        replace: true,
        search: { reason: "trip_forbidden" },
      });
    }
  }, [errorState?.status, navigate]);

  const trip = data?.trip;
  const car = data?.car;
  const violations = data?.violations ?? [];
  const routePoints = data?.points ?? [];
  const loading = status === "loading" && !data;
  /** В Alert показываем только сетевые/прочие ошибки, 404/403 уводят на `/error`. */
  const errorMessage =
    errorState && errorState.status !== 404 && errorState.status !== 403
      ? errorState.message
      : null;
  const tripMapZoneLoading = tripGeozoneStatus === "loading";

  return (
    <Container size="md" py="xl">
      <Stack gap="xl">
        <Group justify="space-between" wrap="nowrap" align="flex-start">
          <Title order={2}>{t(LANG_KEYS.pages.tripViewTitle)}</Title>
          <Button
            component={Link}
            to={ROUTES.dashboard.overview}
            variant="light"
            size="xs"
          >
            {t(LANG_KEYS.pages.tripViewBack)}
          </Button>
        </Group>

        {loading ? (
          <Group justify="center" py="xl">
            <Loader />
          </Group>
        ) : errorMessage ? (
          <Alert color="red" title={t(LANG_KEYS.pages.tripDetailLoadError)}>
            {errorMessage}
          </Alert>
        ) : trip && car ? (
          <>
            <Paper p="md" radius="md" withBorder>
              <Stack gap="sm">
                <Text size="sm" fw={700} tt="uppercase" c="dimmed">
                  {t(LANG_KEYS.pages.tripDetailSectionTrip)}
                </Text>
                <Divider />
                <Row label={t(LANG_KEYS.pages.tripViewId)} value={trip.id} />
                <Row
                  label={t(LANG_KEYS.pages.tripViewStatus)}
                  value={t(tripStatusLangKey(trip.status))}
                />
                <Row
                  label={t(LANG_KEYS.pages.tripViewUser)}
                  value={trip.userId}
                />
                <Row
                  label={t(LANG_KEYS.pages.tripViewCar)}
                  value={trip.carId}
                />
                <Row
                  label={t(LANG_KEYS.pages.tripDetailGeoZoneVersionId)}
                  value={trip.geoZoneVersionId ?? "—"}
                />
                {trip.tariffVersionId ? (
                  <Row
                    label={t(LANG_KEYS.pages.tripDetailTariffVersionId)}
                    value={trip.tariffVersionId}
                  />
                ) : null}
                <Row
                  label={t(LANG_KEYS.pages.tripViewStarted)}
                  value={new Date(trip.startedAt).toLocaleString()}
                />
                <Row
                  label={t(LANG_KEYS.pages.tripViewFinished)}
                  value={
                    trip.finishedAt
                      ? new Date(trip.finishedAt).toLocaleString()
                      : "—"
                  }
                />
                {trip.pauseStartedAt ? (
                  <Row
                    label={t(LANG_KEYS.pages.tripDetailPauseStarted)}
                    value={new Date(trip.pauseStartedAt).toLocaleString()}
                  />
                ) : null}
                <Row
                  label={t(LANG_KEYS.pages.tripDetailTotalPausedSec)}
                  value={trip.totalPausedSec}
                />
                <Row
                  label={t(LANG_KEYS.pages.tripDetailStartCoords)}
                  value={fmtCoord(trip.startLat, trip.startLng)}
                />
                <Row
                  label={t(LANG_KEYS.pages.tripDetailFinishCoords)}
                  value={fmtCoord(trip.finishLat, trip.finishLng)}
                />
                <Row
                  label={t(LANG_KEYS.pages.tripDetailDistanceLegacy)}
                  value={trip.distance}
                />
                <Row
                  label={t(LANG_KEYS.pages.tripDetailDistanceMeters)}
                  value={trip.distanceMeters ?? "—"}
                />
                <Row
                  label={t(LANG_KEYS.pages.tripDetailDurationLegacy)}
                  value={trip.duration}
                />
                <Row
                  label={t(LANG_KEYS.pages.tripDetailChargedMinutes)}
                  value={trip.chargedMinutes ?? "—"}
                />
                <Row
                  label={t(LANG_KEYS.pages.tripDetailChargedKm)}
                  value={trip.chargedKm ?? "—"}
                />
                <Row
                  label={t(LANG_KEYS.pages.tripDetailPriceTime)}
                  value={fmtMoney(trip.priceTime)}
                />
                <Row
                  label={t(LANG_KEYS.pages.tripDetailPriceDistance)}
                  value={fmtMoney(trip.priceDistance)}
                />
                <Row
                  label={t(LANG_KEYS.pages.tripDetailPricePause)}
                  value={fmtMoney(trip.pricePause)}
                />
                <Row
                  label={t(LANG_KEYS.pages.tripDetailPriceTotal)}
                  value={fmtMoney(trip.priceTotal)}
                />
                <Row
                  label={t(LANG_KEYS.pages.tripDetailCreatedAt)}
                  value={new Date(trip.createdAt).toLocaleString()}
                />
                <Row
                  label={t(LANG_KEYS.pages.tripDetailUpdatedAt)}
                  value={new Date(trip.updatedAt).toLocaleString()}
                />
                <Row
                  label={t(LANG_KEYS.pages.tripDetailCarPlateSnapshot)}
                  value={trip.carPlateSnapshot ?? "—"}
                />
                <Row
                  label={t(LANG_KEYS.pages.tripDetailCarDisplayNameSnapshot)}
                  value={trip.carDisplayNameSnapshot ?? "—"}
                />
                <Button
                  component={Link}
                  to={ROUTES.dashboard.userView(trip.userId)}
                  variant="light"
                  size="xs"
                  mt="xs"
                  style={{ alignSelf: "flex-start" }}
                >
                  {t(LANG_KEYS.pages.tripViewOpenUser)}
                </Button>
              </Stack>
            </Paper>

            <Paper p="md" radius="md" withBorder>
              <Stack gap="sm">
                <Text size="sm" fw={700} tt="uppercase" c="dimmed">
                  {t(LANG_KEYS.pages.tripDetailSectionCar)}
                </Text>
                <Text size="xs" c="dimmed">
                  {t(LANG_KEYS.pages.tripDetailCarFuelNote)}
                </Text>
                <Divider />
                <Row
                  label={t(LANG_KEYS.pages.tripDetailCarBrandModel)}
                  value={`${car.brand} ${car.model}`}
                />
                <Row
                  label={t(LANG_KEYS.pages.tripDetailCarPlate)}
                  value={car.licensePlate}
                />
                <Row
                  label={t(LANG_KEYS.pages.tripDetailCarColor)}
                  value={car.color}
                />
                <Row
                  label={t(LANG_KEYS.pages.tripDetailCarMileage)}
                  value={car.mileage}
                />
                <Row
                  label={t(LANG_KEYS.pages.tripDetailCarFuelLevel)}
                  value={`${car.fuelLevel}%`}
                />
                <Row
                  label={t(LANG_KEYS.pages.tripDetailCarStatus)}
                  value={
                    CAR_STATUSES_ORDERED.includes(car.carStatus)
                      ? t(carStatusLangKey(car.carStatus))
                      : String(car.carStatus)
                  }
                />
                <Row
                  label={t(LANG_KEYS.pages.tripDetailCarAvailable)}
                  value={car.isAvailable ? "✓" : "—"}
                />
                {car.isDeleted ? (
                  <Text size="sm" c="orange">
                    {t(LANG_KEYS.pages.tripDetailCarDeleted)}
                  </Text>
                ) : null}
              </Stack>
            </Paper>

            <Paper p="md" radius="md" withBorder>
              <Stack gap="sm">
                <Text size="sm" fw={700} tt="uppercase" c="dimmed">
                  {t(LANG_KEYS.pages.tripDetailSectionViolations)}
                </Text>
                <Divider />
                <Row
                  label={t(LANG_KEYS.pages.tripDetailViolationsCount)}
                  value={violations.length}
                />
                {violations.length === 0 ? (
                  <Text size="sm" c="dimmed">
                    {t(LANG_KEYS.pages.tripDetailViolationsEmpty)}
                  </Text>
                ) : (
                  <Stack gap="md">
                    <ScrollArea h={500}>
                      {violations.map((v) => (
                        <ViolationSummaryCard key={v.id} violation={v} />
                      ))}
                    </ScrollArea>
                  </Stack>
                )}
              </Stack>
            </Paper>

            <Paper p="md" radius="md" withBorder>
              <Stack gap="sm">
                <Text size="sm" fw={700} tt="uppercase" c="dimmed">
                  {t(LANG_KEYS.pages.tripDetailSectionTelemetry)}
                </Text>
                {tripMapZoneLoading ? (
                  <Group gap="xs">
                    <Loader size="sm" />
                    <Text size="sm" c="dimmed">
                      {t(LANG_KEYS.pages.tripDetailMapZoneLoading)}
                    </Text>
                  </Group>
                ) : null}
                <TripHistoryRouteMap
                  apiKey={tripMapApiKey}
                  points={routePoints}
                  tripGeozone={tripMapGeozone}
                />
              </Stack>
            </Paper>

            <Paper p="md" radius="md" withBorder>
              <Stack gap="xs">
                <Text size="sm" fw={700} tt="uppercase" c="dimmed">
                  {t(LANG_KEYS.pages.tripDetailSectionExtra)}
                </Text>
                <Text size="sm" c="dimmed">
                  {t(LANG_KEYS.pages.tripDetailPlaceholderSoon)}
                </Text>
              </Stack>
            </Paper>
          </>
        ) : null}
      </Stack>
    </Container>
  );
};
TripViewPage.displayName = "TripViewPage";

export { TripViewPage };
