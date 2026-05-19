import {
  ActionIcon,
  Badge,
  Button,
  CopyButton,
  Group,
  Paper,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import { Link } from "@tanstack/react-router";

import type { TripRead } from "@/entities/trip";
import { TripStatus } from "@/entities/trip";
import { tripStatusLangKey } from "@/features/trips/lib/trip-status-lang-key";
import { ROUTES } from "@/shared/config/routes-paths";
import { formatCardDateTime, formatMoney } from "@/shared/lib/format";
import type { LangKey } from "@/shared/i18n/keys";
import { LANG_KEYS } from "@/shared/i18n/keys";

type Props = {
  trip: TripRead;
  t: (key: LangKey) => string;
  locale: string;
};

const ArrowIcon = () => (
  <svg
    width={16}
    height={16}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </svg>
);

const TripGridCard = ({ trip, t, locale }: Props) => {
  const statusLabel = t(tripStatusLangKey(trip.status));
  const plate =
    trip.carPlateSnapshot?.trim() ||
    trip.carDisplayNameSnapshot?.trim() ||
    trip.carId;
  const price =
    trip.priceTotal != null
      ? formatMoney(trip.priceTotal, { locale, currency: "RUB" })
      : trip.status === TripStatus.FINISHED
        ? t(LANG_KEYS.pages.tripDetailPriceCalculating)
        : "—";

  return (
    <Paper radius="md" p="md" withBorder shadow="xs">
      <Stack gap="sm">
        <Group
          justify="space-between"
          align="flex-start"
          wrap="nowrap"
          gap="xs"
        >
          <Stack gap={4} style={{ minWidth: 0 }}>
            <Badge
              variant="light"
              size="lg"
              style={{ alignSelf: "flex-start" }}
            >
              {statusLabel}
            </Badge>
            <Text fw={700} size="lg" truncate="end">
              {plate}
            </Text>
            <Group gap={6} wrap="nowrap" align="center">
              <Text
                size="xs"
                c="dimmed"
                ff="monospace"
                truncate="end"
                style={{ flex: 1, minWidth: 0 }}
              >
                {trip.id}
              </Text>
              <CopyButton value={trip.id} timeout={2000}>
                {({ copied, copy }) => (
                  <Button
                    variant="light"
                    size="compact-xs"
                    onClick={copy}
                    flex="0 0 auto"
                  >
                    {copied
                      ? t(LANG_KEYS.pages.carsCardCopied)
                      : t(LANG_KEYS.pages.carsCardCopy)}
                  </Button>
                )}
              </CopyButton>
            </Group>
          </Stack>
          <Tooltip label={t(LANG_KEYS.pages.tripsViewAria)}>
            <ActionIcon
              component={Link}
              to={ROUTES.dashboard.tripView(trip.id)}
              variant="light"
              size="lg"
              aria-label={t(LANG_KEYS.pages.tripsViewAria)}
            >
              <ArrowIcon />
            </ActionIcon>
          </Tooltip>
        </Group>

        <Text size="sm" c="dimmed" truncate="end">
          {t(LANG_KEYS.pages.tripsColUser)}: {trip.userId}
        </Text>

        <Text size="sm">
          {t(LANG_KEYS.pages.tripsColStarted)}:{" "}
          {formatCardDateTime(trip.startedAt, locale)}
        </Text>
        <Text size="sm">
          {t(LANG_KEYS.pages.tripsColFinished)}:{" "}
          {formatCardDateTime(trip.finishedAt, locale)}
        </Text>

        <Text size="sm" fw={600}>
          {t(LANG_KEYS.pages.tripsColPrice)}: {price}
        </Text>
      </Stack>
    </Paper>
  );
};
TripGridCard.displayName = "TripGridCard";

export { TripGridCard };
