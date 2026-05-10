import {
  Alert,
  Button,
  Container,
  Group,
  Loader,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import type { TripRead } from "@/entities/trip";
import { tripStatusLangKey } from "@/features/trips/lib/trip-status-lang-key";
import { tripsApi } from "@/features/trips/api";
import { LANG_KEYS } from "@/shared/i18n/keys";
import { ROUTES } from "@/shared/config/routes-paths";

const TripViewPage = () => {
  const { t } = useTranslation();
  const { tripId } = useParams({
    from: "/dashboard/trips/$tripId",
  });
  const [trip, setTrip] = useState<TripRead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    void (async () => {
      try {
        const data = await tripsApi.findById(tripId);
        if (!cancelled) {
          setTrip(data);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
          setTrip(null);
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
  }, [tripId]);

  return (
    <Container size="sm" py="xl">
      <Stack gap="lg">
        <Group justify="space-between">
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
        ) : error ? (
          <Alert color="red">{error}</Alert>
        ) : trip ? (
          <Stack gap="xs">
            <Text size="sm">
              <Text span fw={600}>
                {t(LANG_KEYS.pages.tripViewId)}
              </Text>{" "}
              {trip.id}
            </Text>
            <Text size="sm">
              <Text span fw={600}>
                {t(LANG_KEYS.pages.tripViewStatus)}
              </Text>{" "}
              {t(tripStatusLangKey(trip.status))}
            </Text>
            <Text size="sm">
              <Text span fw={600}>
                {t(LANG_KEYS.pages.tripViewCar)}
              </Text>{" "}
              {trip.carId}
            </Text>
            <Text size="sm">
              <Text span fw={600}>
                {t(LANG_KEYS.pages.tripViewUser)}
              </Text>{" "}
              {trip.userId}
            </Text>
            <Text size="sm">
              <Text span fw={600}>
                {t(LANG_KEYS.pages.tripViewStarted)}
              </Text>{" "}
              {new Date(trip.startedAt).toLocaleString()}
            </Text>
            {trip.finishedAt ? (
              <Text size="sm">
                <Text span fw={600}>
                  {t(LANG_KEYS.pages.tripViewFinished)}
                </Text>{" "}
                {new Date(trip.finishedAt).toLocaleString()}
              </Text>
            ) : null}
            <Button
              component={Link}
              to={ROUTES.dashboard.userView(trip.userId)}
              variant="light"
              size="xs"
              mt="sm"
            >
              {t(LANG_KEYS.pages.tripViewOpenUser)}
            </Button>
          </Stack>
        ) : null}
      </Stack>
    </Container>
  );
};
TripViewPage.displayName = "TripViewPage";

export { TripViewPage };
