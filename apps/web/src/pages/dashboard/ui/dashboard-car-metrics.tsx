import { Divider, Stack, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";

import type { CarRead } from "@/entities/car";
import {
  CAR_STATUSES_ORDERED,
  carStatusLangKey,
} from "@/features/cars/lib/car-status-present";
import { LANG_KEYS } from "@/shared/i18n/keys";

type Props = {
  car: CarRead;
};

export function DashboardCarMetrics({ car }: Props) {
  const { t } = useTranslation();

  return (
    <>
      <Stack gap={4}>
        <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
          {t(LANG_KEYS.pages.dashboardCarPanelSectionCar)}
        </Text>
        <Text size="sm">
          {car.brand} {car.model}
        </Text>
        <Text size="xs" c="dimmed">
          {t(LANG_KEYS.pages.dashboardCarPanelPlate)}{" "}
          <Text span fw={600} c="var(--mantine-color-text)">
            {car.licensePlate}
          </Text>
        </Text>
        <Text size="xs" c="dimmed">
          {t(LANG_KEYS.pages.dashboardCarPanelStatus)}{" "}
          <Text span fw={600} c="var(--mantine-color-text)">
            {CAR_STATUSES_ORDERED.includes(car.carStatus)
              ? t(carStatusLangKey(car.carStatus))
              : String(car.carStatus)}
          </Text>
        </Text>
        <Text size="xs" c="dimmed">
          {t(LANG_KEYS.pages.dashboardCarPanelFuel)}{" "}
          <Text span fw={600} c="var(--mantine-color-text)">
            {car.fuelLevel}%
          </Text>
        </Text>
        <Text size="xs" c="dimmed">
          {t(LANG_KEYS.pages.dashboardCarPanelMileage)}{" "}
          <Text span fw={600} c="var(--mantine-color-text)">
            {car.mileage}
          </Text>
        </Text>
      </Stack>
      <Divider />
    </>
  );
}
