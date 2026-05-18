import {
  Accordion,
  ActionIcon,
  Alert,
  Anchor,
  Badge,
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
import { useDisclosure } from "@mantine/hooks";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { useAction, useAtom } from "@reatom/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import type { TripNotificationRead } from "@/entities/manager-violation-notice";
import type { ReadUser } from "@/entities/user";
import { TripStatus } from "@/entities/trip";

import { UserRole } from "@/entities/user/model/user-role";
import { usersApi } from "@/features/auth/api";
import {
  CAR_STATUSES_ORDERED,
  carStatusLangKey,
} from "@/features/cars/lib/car-status-present";
import { authUserAtom } from "@/features/auth/model/session";
import { managerViolationNoticeApi } from "@/features/manager-violation-notice/api";
import {
  tripNotificationDetailsText,
  tripNotificationMessagePreview,
} from "@/features/manager-violation-notice/lib/trip-notification-preview";
import { SendViolationNoticeModal } from "@/features/manager-violation-notice/ui/send-violation-notice-modal";
import {
  useLiveTrip,
  useLiveTripOverlay,
} from "@/features/trip-realtime/hooks/use-live-trip";
import {
  registerTripWatch,
  unregisterTripWatch,
} from "@/features/trip-realtime/model/live-trip-overlay";
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
import {
  ViolationSummaryCard,
  PencilGlyph,
} from "@/features/violations/ui/violation-summary-card";
import { ROUTES } from "@/shared/config/routes-paths";
import { getYandexMapsApiKey } from "@/shared/config/env";
import { formatCardDateTime, formatCoord, formatMoney } from "@/shared/lib/format";
import { isOngoingTripStatus } from "@/shared/lib/is-ongoing-trip-status";
import { LANG_KEYS } from "@/shared/i18n/keys";

import { TripHistoryRouteMap } from "@/pages/trip/ui/trip-history-route-map";
import type { ViolationRead } from "@/entities/violation";

const tripMapApiKey = getYandexMapsApiKey();

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

function tripEmailNoticeBadgeColor(status: string): string {
  const s = (status || "").toUpperCase();
  if (s === "SENT") {
    return "green";
  }
  if (s === "FAILED") {
    return "red";
  }
  if (s === "PENDING") {
    return "yellow";
  }
  return "gray";
}

const TripViewPage = () => {
  const { t } = useTranslation();
  const emailNoticeStatusLabel = (status: string): string => {
    const s = (status || "").toUpperCase();
    if (s === "SENT") {
      return t(LANG_KEYS.pages.tripDetailEmailNoticeStatusSENT);
    }
    if (s === "FAILED") {
      return t(LANG_KEYS.pages.tripDetailEmailNoticeStatusFAILED);
    }
    if (s === "PENDING") {
      return t(LANG_KEYS.pages.tripDetailEmailNoticeStatusPENDING);
    }
    return status || "—";
  };
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
  const [authUser] = useAtom(authUserAtom);
  const [
    noticeOpened,
    { open: openViolationNotice, close: closeViolationNotice },
  ] = useDisclosure(false);

  const loadFull = useAction(loadTripHistoryFull);
  const loadZone = useAction(loadTripGeozoneForMap);
  const resetView = useAction(resetTripHistoryView);
  const watchTrip = useAction(registerTripWatch);
  const unwatchTrip = useAction(unregisterTripWatch);

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
  const shownTrip = useLiveTrip(trip) ?? trip;
  const tripOverlay = useLiveTripOverlay(tripId);
  const car = data?.car;
  const violations = data?.violations ?? [];
  useEffect(() => {
    if (!trip || !isOngoingTripStatus(trip.status)) {
      return;
    }
    watchTrip(trip.id);
    return () => {
      unwatchTrip(trip.id);
    };
  }, [trip?.id, trip?.status, watchTrip, unwatchTrip]);

  useEffect(() => {
    if (tripOverlay?.status !== TripStatus.FINISHED) {
      return;
    }
    void loadFull(tripId);
  }, [tripOverlay?.status, tripOverlay?.updatedAt, tripId, loadFull]);

  const violationById = useMemo(() => {
    const m = new Map<string, ViolationRead>();
    for (const violation of violations) {
      m.set(violation.id, violation);
    }
    return m;
  }, [violations]);

  const [emailNotices, setEmailNotices] = useState<TripNotificationRead[]>([]);
  const [emailNoticesPhase, setEmailNoticesPhase] = useState<
    "loading" | "ok" | "error"
  >("loading");
  const [emailNoticesError, setEmailNoticesError] = useState<string | null>(
    null,
  );

  const loadEmailNotices = useCallback(async () => {
    setEmailNoticesPhase("loading");
    setEmailNoticesError(null);
    try {
      const list =
        await managerViolationNoticeApi.listTripNotifications(tripId);
      setEmailNotices(list);
      setEmailNoticesPhase("ok");
    } catch (e) {
      setEmailNoticesPhase("error");
      setEmailNoticesError(e instanceof Error ? e.message : String(e));
      setEmailNotices([]);
    }
  }, [tripId]);

  const [userById, setUserById] = useState<Map<string, ReadUser>>(
    () => new Map(),
  );

  useEffect(() => {
    const ids = new Set<string>();
    if (trip?.userId?.trim()) {
      ids.add(trip.userId.trim());
    }
    for (const n of emailNotices) {
      if (n.userId?.trim()) {
        ids.add(n.userId.trim());
      }
    }
    const list = [...ids];
    if (list.length === 0) {
      setUserById(new Map());
      return;
    }
    let cancelled = false;
    // TODO: заменить на Reatom
    void Promise.all(
      list.map((id) =>
        usersApi
          .findById(id)
          .then((u) => ({ id, u }))
          .catch(() => ({ id, u: undefined as ReadUser | undefined })),
      ),
    ).then((rows) => {
      if (cancelled) {
        return;
      }
      const m = new Map<string, ReadUser>();
      for (const { id, u } of rows) {
        if (u) {
          m.set(id, u);
        }
      }
      setUserById(m);
    });
    return () => {
      cancelled = true;
    };
  }, [trip?.userId, emailNotices]);

  useEffect(() => {
    void loadEmailNotices();
  }, [loadEmailNotices]);

  const routePoints = data?.points ?? [];
  const loading = status === "loading" && !data;
  /** В Alert показываем только сетевые/прочие ошибки, 404/403 уводят на `/error`. */
  const errorMessage =
    errorState && errorState.status !== 404 && errorState.status !== 403
      ? errorState.message
      : null;
  const tripMapZoneLoading = tripGeozoneStatus === "loading";
  const canSendViolationNotice =
    authUser != null &&
    (authUser.role === UserRole.MANAGER ||
      authUser.role === UserRole.SYSTEM_ADMIN);

  const userNameLink = (userId: string | null | undefined) => {
    const id = userId?.trim() ?? "";
    if (!id) {
      return (
        <Text component="span" size="sm" c="dimmed">
          —
        </Text>
      );
    }
    const u = userById.get(id);
    if (u) {
      return (
        <Anchor
          component={Link}
          to={ROUTES.dashboard.userView(id)}
          size="sm"
          fw={500}
        >
          {u.name}
        </Anchor>
      );
    }
    return (
      <Text component="span" size="sm" ff="monospace">
        {id}
      </Text>
    );
  };

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
        ) : shownTrip && car ? (
          <>
            <Paper p="md" radius="md" withBorder>
              <Stack gap="sm">
                <Text size="sm" fw={700} tt="uppercase" c="dimmed">
                  {t(LANG_KEYS.pages.tripDetailSectionTrip)}
                </Text>
                <Divider />
                <Row label={t(LANG_KEYS.pages.tripViewId)} value={shownTrip.id} />
                <Row
                  label={t(LANG_KEYS.pages.tripViewStatus)}
                  value={t(tripStatusLangKey(shownTrip.status))}
                />
                <Text size="sm">
                  <Text span fw={600}>
                    {t(LANG_KEYS.pages.tripViewUser)}
                  </Text>{" "}
                  {userNameLink(shownTrip.userId)}
                </Text>
                <Row
                  label={t(LANG_KEYS.pages.tripViewCar)}
                  value={shownTrip.carId}
                />
                <Row
                  label={t(LANG_KEYS.pages.tripDetailGeoZoneVersionId)}
                  value={shownTrip.geoZoneVersionId ?? "—"}
                />
                {shownTrip.tariffVersionId ? (
                  <Row
                    label={t(LANG_KEYS.pages.tripDetailTariffVersionId)}
                    value={shownTrip.tariffVersionId}
                  />
                ) : null}
                <Row
                  label={t(LANG_KEYS.pages.tripViewStarted)}
                  value={formatCardDateTime(shownTrip.startedAt)}
                />
                <Row
                  label={t(LANG_KEYS.pages.tripViewFinished)}
                  value={formatCardDateTime(shownTrip.finishedAt)}
                />
                {shownTrip.pauseStartedAt ? (
                  <Row
                    label={t(LANG_KEYS.pages.tripDetailPauseStarted)}
                    value={formatCardDateTime(shownTrip.pauseStartedAt)}
                  />
                ) : null}
                <Row
                  label={t(LANG_KEYS.pages.tripDetailTotalPausedSec)}
                  value={shownTrip.totalPausedSec}
                />
                <Row
                  label={t(LANG_KEYS.pages.tripDetailStartCoords)}
                  value={formatCoord(shownTrip.startLat, shownTrip.startLng)}
                />
                <Row
                  label={t(LANG_KEYS.pages.tripDetailFinishCoords)}
                  value={formatCoord(shownTrip.finishLat, shownTrip.finishLng)}
                />
                <Row
                  label={t(LANG_KEYS.pages.tripDetailDistanceLegacy)}
                  value={shownTrip.distance}
                />
                <Row
                  label={t(LANG_KEYS.pages.tripDetailDistanceMeters)}
                  value={shownTrip.distanceMeters ?? "—"}
                />
                <Row
                  label={t(LANG_KEYS.pages.tripDetailDurationLegacy)}
                  value={shownTrip.duration}
                />
                <Row
                  label={t(LANG_KEYS.pages.tripDetailChargedMinutes)}
                  value={shownTrip.chargedMinutes ?? "—"}
                />
                <Row
                  label={t(LANG_KEYS.pages.tripDetailChargedKm)}
                  value={shownTrip.chargedKm ?? "—"}
                />
                <Row
                  label={t(LANG_KEYS.pages.tripDetailPriceTime)}
                  value={formatMoney(shownTrip.priceTime)}
                />
                <Row
                  label={t(LANG_KEYS.pages.tripDetailPriceDistance)}
                  value={formatMoney(shownTrip.priceDistance)}
                />
                <Row
                  label={t(LANG_KEYS.pages.tripDetailPricePause)}
                  value={formatMoney(shownTrip.pricePause)}
                />
                <Row
                  label={t(LANG_KEYS.pages.tripDetailPriceTotal)}
                  value={
                    shownTrip.priceTotal != null
                      ? formatMoney(shownTrip.priceTotal)
                      : isOngoingTripStatus(shownTrip.status)
                        ? t(LANG_KEYS.pages.tripDetailPriceCalculating)
                        : "—"
                  }
                />
                <Row
                  label={t(LANG_KEYS.pages.tripDetailCreatedAt)}
                  value={formatCardDateTime(shownTrip.createdAt)}
                />
                <Row
                  label={t(LANG_KEYS.pages.tripDetailUpdatedAt)}
                  value={formatCardDateTime(shownTrip.updatedAt)}
                />
                <Row
                  label={t(LANG_KEYS.pages.tripDetailCarPlateSnapshot)}
                  value={shownTrip.carPlateSnapshot ?? "—"}
                />
                <Row
                  label={t(LANG_KEYS.pages.tripDetailCarDisplayNameSnapshot)}
                  value={shownTrip.carDisplayNameSnapshot ?? "—"}
                />
                <Button
                  component={Link}
                  to={ROUTES.dashboard.userView(shownTrip.userId)}
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
                    {canSendViolationNotice ? (
                      <Group justify="flex-end">
                        <Button
                          size="xs"
                          variant="light"
                          onClick={openViolationNotice}
                        >
                          {t(LANG_KEYS.pages.tripDetailViolationsNotifyDriver)}
                        </Button>
                      </Group>
                    ) : null}
                    <ScrollArea h={500}>
                      {violations.map((v) => (
                        <ViolationSummaryCard key={v.id} violation={v} />
                      ))}
                    </ScrollArea>
                  </Stack>
                )}
              </Stack>
            </Paper>

            {violations.length > 0 ? (
              <SendViolationNoticeModal
                opened={noticeOpened}
                onClose={closeViolationNotice}
                tripId={trip.id}
                violations={violations}
                onSent={() => {
                  void loadEmailNotices();
                }}
              />
            ) : null}

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
              <Stack gap="sm">
                <Text size="sm" fw={700} tt="uppercase" c="dimmed">
                  {t(LANG_KEYS.pages.tripDetailSectionExtra)}
                </Text>
                <Text size="sm" c="dimmed">
                  {t(LANG_KEYS.pages.tripDetailEmailNoticesIntro)}
                </Text>
                {emailNoticesPhase === "loading" ? (
                  <Group gap="xs">
                    <Loader size="sm" />
                    <Text size="sm" c="dimmed">
                      {t(LANG_KEYS.pages.tripDetailMapZoneLoading)}
                    </Text>
                  </Group>
                ) : emailNoticesPhase === "error" ? (
                  <Alert color="red" variant="light">
                    {emailNoticesError ??
                      t(LANG_KEYS.pages.tripDetailEmailNoticesLoadError)}
                  </Alert>
                ) : emailNotices.length === 0 ? (
                  <Text size="sm" c="dimmed">
                    {t(LANG_KEYS.pages.tripDetailEmailNoticesEmpty)}
                  </Text>
                ) : (
                  <Accordion variant="contained" radius="md">
                    {emailNotices.map((n) => {
                      const stLabel = emailNoticeStatusLabel(n.status);
                      return (
                        <Accordion.Item key={n.id} value={String(n.id)}>
                          <Accordion.Control>
                            <Stack gap={4} align="flex-start">
                              <Group gap="xs" wrap="nowrap">
                                <Text size="sm" fw={600}>
                                  {t(LANG_KEYS.pages.tripDetailEmailNoticeId)}
                                  {n.id}
                                </Text>
                                <Badge
                                  size="sm"
                                  color={tripEmailNoticeBadgeColor(n.status)}
                                  variant="light"
                                >
                                  {stLabel}
                                </Badge>
                              </Group>
                              <Text size="xs" c="dimmed" lineClamp={2}>
                                {tripNotificationMessagePreview(n.message) ||
                                  "—"}
                              </Text>
                            </Stack>
                          </Accordion.Control>
                          <Accordion.Panel>
                            <Stack gap="md">
                              <Paper withBorder p="md" radius="md">
                                <Stack gap="sm">
                                  <Text size="xs" c="dimmed">
                                    <Text span fw={600}>
                                      {t(LANG_KEYS.pages.tripViewUser)}
                                    </Text>{" "}
                                    {userNameLink(n.userId)}
                                  </Text>
                                  <Text
                                    size="sm"
                                    lh={1.55}
                                    style={{ whiteSpace: "pre-wrap" }}
                                  >
                                    {tripNotificationDetailsText(n.message) ||
                                      "—"}
                                  </Text>
                                </Stack>
                              </Paper>
                              <Divider />
                              <Text size="sm" fw={600}>
                                {t(
                                  LANG_KEYS.pages
                                    .tripDetailEmailNoticeViolationsInLetter,
                                )}
                              </Text>
                              <Stack gap="md">
                                {n.violationIds.map((vid) => {
                                  const v = violationById.get(vid);
                                  return v ? (
                                    <ViolationSummaryCard
                                      key={vid}
                                      violation={v}
                                      showEditInNewTab
                                    />
                                  ) : (
                                    <Group
                                      key={vid}
                                      justify="space-between"
                                      wrap="nowrap"
                                      align="center"
                                      gap="xs"
                                    >
                                      <Text
                                        size="sm"
                                        c="dimmed"
                                        style={{ flex: 1 }}
                                      >
                                        {t(
                                          LANG_KEYS.pages
                                            .tripDetailEmailNoticeViolationMissing,
                                          { id: vid },
                                        )}
                                      </Text>
                                      <ActionIcon
                                        component={Link}
                                        to={ROUTES.dashboard.violationsEdit(
                                          vid,
                                        )}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        variant="light"
                                        color="gray"
                                        size="md"
                                        radius="md"
                                        aria-label={t(
                                          LANG_KEYS.pages
                                            .tripDetailViolationOpenEditNewTab,
                                        )}
                                      >
                                        <PencilGlyph />
                                      </ActionIcon>
                                    </Group>
                                  );
                                })}
                              </Stack>
                            </Stack>
                          </Accordion.Panel>
                        </Accordion.Item>
                      );
                    })}
                  </Accordion>
                )}
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
