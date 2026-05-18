import { Button, Divider, Paper, Stack, Text } from "@mantine/core";
import { Link } from "@tanstack/react-router";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";

import type { TripRead } from "@/entities/trip";
import type { ReadUser } from "@/entities/user";
import { tripStatusLangKey } from "@/features/trips/lib/trip-status-lang-key";
import { ROUTES } from "@/shared/config/routes-paths";
import {
  formatCardDateTime,
  formatCoord,
  formatMoney,
  formatQuantity,
  formatTripDistanceKm,
} from "@/shared/lib/format";
import { isOngoingTripStatus } from "@/shared/lib/is-ongoing-trip-status";
import type { LangKey } from "@/shared/i18n/keys";
import { LANG_KEYS } from "@/shared/i18n/keys";

import { TripViewRow } from "@/pages/trip/ui/trip-view-row";
import { TripViewUserNameLink } from "@/pages/trip/ui/trip-view-user-name-link";

type Props = {
  trip: TripRead;
  t: TFunction;
  userById: Map<string, ReadUser>;
};

export function TripViewTripDetailsSection({ trip, t, userById }: Props) {
  const { i18n } = useTranslation();
  const tk = (key: LangKey) => t(key);
  const locale = i18n.language;
  const money = { locale, currency: "RUB" as const };

  const distanceKm = formatTripDistanceKm(trip.distanceMeters, trip.distance);
  const distanceValue =
    distanceKm === "—"
      ? distanceKm
      : formatQuantity(Number(distanceKm), tk(LANG_KEYS.common.unitKm), locale);

  return (
    <Paper p="md" radius="md" withBorder>
      <Stack gap="sm">
        <Text size="sm" fw={700} tt="uppercase" c="dimmed">
          {tk(LANG_KEYS.pages.tripDetailSectionTrip)}
        </Text>
        <Divider />
        <TripViewRow label={tk(LANG_KEYS.pages.tripViewId)} value={trip.id} />
        <TripViewRow
          label={tk(LANG_KEYS.pages.tripViewStatus)}
          value={tk(tripStatusLangKey(trip.status))}
        />
        <TripViewRow
          label={tk(LANG_KEYS.pages.tripViewUser)}
          value={
            <TripViewUserNameLink userId={trip.userId} userById={userById} />
          }
        />
        <TripViewRow
          label={tk(LANG_KEYS.pages.tripViewStarted)}
          value={formatCardDateTime(trip.startedAt, locale)}
        />
        <TripViewRow
          label={tk(LANG_KEYS.pages.tripViewFinished)}
          value={formatCardDateTime(trip.finishedAt, locale)}
        />
        {trip.pauseStartedAt ? (
          <TripViewRow
            label={tk(LANG_KEYS.pages.tripDetailPauseStarted)}
            value={formatCardDateTime(trip.pauseStartedAt, locale)}
          />
        ) : null}
        <TripViewRow
          label={tk(LANG_KEYS.pages.tripDetailTotalPausedSec)}
          value={formatQuantity(
            trip.totalPausedSec,
            tk(LANG_KEYS.common.unitSec),
            locale,
          )}
        />
        <TripViewRow
          label={tk(LANG_KEYS.pages.tripDetailStartCoords)}
          value={formatCoord(trip.startLat, trip.startLng)}
        />
        <TripViewRow
          label={tk(LANG_KEYS.pages.tripDetailFinishCoords)}
          value={formatCoord(trip.finishLat, trip.finishLng)}
        />
        <TripViewRow
          label={tk(LANG_KEYS.pages.tripDetailDistance)}
          value={distanceValue}
        />
        <TripViewRow
          label={tk(LANG_KEYS.pages.tripDetailChargedMinutes)}
          value={formatQuantity(
            trip.chargedMinutes,
            tk(LANG_KEYS.common.unitMin),
            locale,
          )}
        />
        <TripViewRow
          label={tk(LANG_KEYS.pages.tripDetailChargedKm)}
          value={formatQuantity(
            trip.chargedKm,
            tk(LANG_KEYS.common.unitKm),
            locale,
          )}
        />
        <TripViewRow
          label={tk(LANG_KEYS.pages.tripDetailPriceTime)}
          value={formatMoney(trip.priceTime, money)}
        />
        <TripViewRow
          label={tk(LANG_KEYS.pages.tripDetailPriceDistance)}
          value={formatMoney(trip.priceDistance, money)}
        />
        <TripViewRow
          label={tk(LANG_KEYS.pages.tripDetailPricePause)}
          value={formatMoney(trip.pricePause, money)}
        />
        <TripViewRow
          label={tk(LANG_KEYS.pages.tripDetailPriceTotal)}
          value={
            trip.priceTotal != null
              ? formatMoney(trip.priceTotal, money)
              : isOngoingTripStatus(trip.status)
                ? tk(LANG_KEYS.pages.tripDetailPriceCalculating)
                : "—"
          }
        />
        <TripViewRow
          label={tk(LANG_KEYS.pages.tripDetailCreatedAt)}
          value={formatCardDateTime(trip.createdAt, locale)}
        />
        <TripViewRow
          label={tk(LANG_KEYS.pages.tripDetailUpdatedAt)}
          value={formatCardDateTime(trip.updatedAt, locale)}
        />
        <Button
          component={Link}
          to={ROUTES.dashboard.userView(trip.userId)}
          variant="light"
          size="xs"
          mt="xs"
          style={{ alignSelf: "flex-start" }}
        >
          {tk(LANG_KEYS.pages.tripViewOpenUser)}
        </Button>
      </Stack>
    </Paper>
  );
}
