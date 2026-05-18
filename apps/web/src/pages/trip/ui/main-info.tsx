import type { TripRead } from "@/entities/trip";
import { tripStatusLangKey } from "@/features/trips/lib/trip-status-lang-key";
import { ROUTES } from "@/shared/config/routes-paths";
import { LANG_KEYS } from "@/shared/i18n";
import {
  formatCardDateTime,
  formatCoord,
  formatMoney,
} from "@/shared/lib/format";
import { isOngoingTripStatus } from "@/shared/lib/is-ongoing-trip-status";
import { Paper, Stack, Divider, Button, Text } from "@mantine/core";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

type MainInfoProps = {
  trip: TripRead;
};

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

export const MainInfo = ({ trip }: MainInfoProps) => {
  const { t } = useTranslation();
  return (
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
          <Row label={t(LANG_KEYS.pages.tripViewUser)} value={trip.userId} />
          <Row label={t(LANG_KEYS.pages.tripViewCar)} value={trip.carId} />
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
            value={formatCardDateTime(trip.startedAt)}
          />
          <Row
            label={t(LANG_KEYS.pages.tripViewFinished)}
            value={formatCardDateTime(trip.finishedAt)}
          />
          {trip.pauseStartedAt ? (
            <Row
              label={t(LANG_KEYS.pages.tripDetailPauseStarted)}
              value={formatCardDateTime(trip.pauseStartedAt)}
            />
          ) : null}
          <Row
            label={t(LANG_KEYS.pages.tripDetailTotalPausedSec)}
            value={trip.totalPausedSec}
          />
          <Row
            label={t(LANG_KEYS.pages.tripDetailStartCoords)}
            value={formatCoord(trip.startLat, trip.startLng)}
          />
          <Row
            label={t(LANG_KEYS.pages.tripDetailFinishCoords)}
            value={formatCoord(trip.finishLat, trip.finishLng)}
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
            value={formatMoney(trip.priceTime)}
          />
          <Row
            label={t(LANG_KEYS.pages.tripDetailPriceDistance)}
            value={formatMoney(trip.priceDistance)}
          />
          <Row
            label={t(LANG_KEYS.pages.tripDetailPricePause)}
            value={formatMoney(trip.pricePause)}
          />
          <Row
            label={t(LANG_KEYS.pages.tripDetailPriceTotal)}
            value={
              trip.priceTotal != null
                ? formatMoney(trip.priceTotal)
                : isOngoingTripStatus(trip.status)
                  ? t(LANG_KEYS.pages.tripDetailPriceCalculating)
                  : "—"
            }
          />
          <Row
            label={t(LANG_KEYS.pages.tripDetailCreatedAt)}
            value={formatCardDateTime(trip.createdAt)}
          />
          <Row
            label={t(LANG_KEYS.pages.tripDetailUpdatedAt)}
            value={formatCardDateTime(trip.updatedAt)}
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
    </>
  );
};
