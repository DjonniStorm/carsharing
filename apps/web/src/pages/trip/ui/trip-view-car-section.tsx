import { Button, Divider, Paper, Stack, Text } from "@mantine/core";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import type { CarRead } from "@/entities/car";
import {
  CAR_STATUSES_ORDERED,
  carStatusLangKey,
} from "@/features/cars/lib/car-status-present";
import { ROUTES } from "@/shared/config/routes-paths";
import { formatQuantity } from "@/shared/lib/format";
import { LANG_KEYS } from "@/shared/i18n/keys";

import { TripViewRow } from "@/pages/trip/ui/trip-view-row";

type Props = {
  car: CarRead;
};

export function TripViewCarSection({ car }: Props) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;

  return (
    <Paper p="md" radius="md" withBorder>
      <Stack gap="sm">
        <Text size="sm" fw={700} tt="uppercase" c="dimmed">
          {t(LANG_KEYS.pages.tripDetailSectionCar)}
        </Text>
        <Divider />
        <TripViewRow
          label={t(LANG_KEYS.pages.tripDetailCarBrandModel)}
          value={`${car.brand} ${car.model}`}
        />
        <TripViewRow
          label={t(LANG_KEYS.pages.tripDetailCarPlate)}
          value={car.licensePlate}
        />
        <TripViewRow
          label={t(LANG_KEYS.pages.tripDetailCarColor)}
          value={car.color}
        />
        <TripViewRow
          label={t(LANG_KEYS.pages.tripDetailCarMileage)}
          value={formatQuantity(
            car.mileage,
            t(LANG_KEYS.common.unitKm),
            locale,
          )}
        />
        <TripViewRow
          label={t(LANG_KEYS.pages.tripDetailCarFuelLevel)}
          value={formatQuantity(
            Math.round(car.fuelLevel),
            t(LANG_KEYS.common.unitPercent),
            locale,
          )}
        />
        <TripViewRow
          label={t(LANG_KEYS.pages.tripDetailCarStatus)}
          value={
            CAR_STATUSES_ORDERED.includes(car.carStatus)
              ? t(carStatusLangKey(car.carStatus))
              : String(car.carStatus)
          }
        />
        <TripViewRow
          label={t(LANG_KEYS.pages.tripDetailCarAvailable)}
          value={
            car.isAvailable
              ? t(LANG_KEYS.pages.carsCardAvailYes)
              : t(LANG_KEYS.pages.carsCardAvailNo)
          }
        />
        {car.isDeleted ? (
          <Text size="sm" c="orange">
            {t(LANG_KEYS.pages.tripDetailCarDeleted)}
          </Text>
        ) : null}
        <Button
          component={Link}
          to={ROUTES.dashboard.cars}
          variant="light"
          size="xs"
          mt="xs"
          style={{ alignSelf: "flex-start" }}
        >
          {t(LANG_KEYS.pages.tripViewOpenCarsList)}
        </Button>
      </Stack>
    </Paper>
  );
}
