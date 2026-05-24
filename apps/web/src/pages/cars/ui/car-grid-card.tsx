import {
  Badge,
  Button,
  CopyButton,
  Group,
  Paper,
  RingProgress,
  Stack,
  Text,
} from "@mantine/core";
import type { ReactNode } from "react";

import { Link } from "@tanstack/react-router";

import type { CarRead } from "@/entities/car";
import { isCarEligibleForReturnWizard } from "@/features/cars/lib/car-return-to-service-present";
import { ROUTES } from "@/shared/config/routes-paths";
import {
  carStatusBadgeColor,
  carStatusLangKey,
} from "@/features/cars/lib/car-status-present";
import type { LangKey } from "@/shared/i18n/keys";
import { LANG_KEYS } from "@/shared/i18n/keys";
import { formatCardDateTime } from "@/shared/lib/format";

type Props = {
  car: CarRead;
  t: (key: LangKey) => string;
  onEdit?: (car: CarRead) => void;
};

function CarCardField({
  label,
  value,
  valueFw,
}: {
  label: string;
  value: ReactNode;
  valueFw?: number;
}) {
  return (
    <Group justify="space-between" align="flex-start" wrap="nowrap" gap="md">
      <Text size="sm" c="dimmed" style={{ flex: "0 1 auto" }}>
        {label}
      </Text>
      <Text
        size="sm"
        fw={valueFw}
        ta="right"
        style={{ flex: "1 1 auto", minWidth: 0, wordBreak: "break-word" }}
      >
        {value}
      </Text>
    </Group>
  );
}

const CarGridCard = ({ car, t, onEdit }: Props) => {
  const statusLabel = t(carStatusLangKey(car.carStatus));

  return (
    <Paper radius="md" p="md" withBorder shadow="xs">
      <Stack gap="sm">
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <Stack gap={2} style={{ minWidth: 0 }}>
            <Group gap="xs" wrap="wrap" align="center">
              <Text fw={700} size="lg" truncate="end">
                {car.licensePlate}
              </Text>
              {car.isDeleted ? (
                <Badge color="gray" variant="light" size="sm">
                  {t(LANG_KEYS.pages.carsCardDeleted)}
                </Badge>
              ) : null}
            </Group>
            <Text size="sm" c="dimmed" truncate="end">
              {car.brand} {car.model}
            </Text>
            <Group gap={6} wrap="nowrap" align="center">
              <Text
                size="xs"
                c="dimmed"
                truncate="end"
                ff="monospace"
                style={{ flex: 1, minWidth: 0 }}
              >
                {t(LANG_KEYS.pages.carsCardId)}: {car.id}
              </Text>
              <CopyButton value={car.id} timeout={2000}>
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
          <Stack gap={6} align="flex-end">
            {onEdit ? (
              <Button
                variant="light"
                size="compact-xs"
                onClick={() => {
                  onEdit(car);
                }}
              >
                {t(LANG_KEYS.pages.carsEditButton)}
              </Button>
            ) : null}
            {isCarEligibleForReturnWizard(car) ? (
              <Link
                to={ROUTES.dashboard.carReturnToService(car.id)}
                style={{ textDecoration: "none" }}
              >
                <Button component="span" size="compact-xs" color="teal">
                  {t(LANG_KEYS.pages.carsReturnToServiceButton)}
                </Button>
              </Link>
            ) : null}
            <Badge color={carStatusBadgeColor(car.carStatus)} variant="light">
              {statusLabel}
            </Badge>
          </Stack>
        </Group>

        <Group gap="lg" wrap="nowrap">
          <Stack gap={4} align="center">
            <RingProgress
              size={56}
              thickness={6}
              sections={[
                {
                  value: Math.min(100, Math.max(0, car.fuelLevel)),
                  color: "cyan.6",
                },
              ]}
              label={
                <Text size="xs" fw={600} ta="center">
                  {Math.round(car.fuelLevel)}%
                </Text>
              }
            />
            <Text size="xs" c="dimmed" ta="center">
              {t(LANG_KEYS.pages.carsCardFuel)}
            </Text>
          </Stack>

          <Stack gap={6} style={{ flex: 1, minWidth: 0 }}>
            <CarCardField
              label={t(LANG_KEYS.pages.carsColFuel)}
              value={`${Math.round(car.fuelLevel)}%`}
              valueFw={500}
            />
            <CarCardField
              label={t(LANG_KEYS.pages.carsCardMileage)}
              value={car.mileage.toLocaleString()}
              valueFw={500}
            />
            <CarCardField
              label={t(LANG_KEYS.pages.carsCardColor)}
              value={car.color}
              valueFw={500}
            />
            <CarCardField
              label={t(LANG_KEYS.pages.carsAddFieldAvailable)}
              value={
                car.isAvailable
                  ? t(LANG_KEYS.pages.carsCardAvailYes)
                  : t(LANG_KEYS.pages.carsCardAvailNo)
              }
              valueFw={500}
            />
            <CarCardField
              label={t(LANG_KEYS.pages.carsColPosition)}
              value={
                car.lastKnownLon != null && car.lastKnownLat != null
                  ? `${car.lastKnownLat.toFixed(4)}, ${car.lastKnownLon.toFixed(4)}`
                  : "—"
              }
            />
            <CarCardField
              label={t(LANG_KEYS.pages.carsCardLastPosAt)}
              value={formatCardDateTime(car.lastPositionAt)}
            />
            <CarCardField
              label={t(LANG_KEYS.pages.carsCardCreatedAt)}
              value={formatCardDateTime(car.createdAt)}
            />
            <CarCardField
              label={t(LANG_KEYS.pages.carsCardUpdatedAt)}
              value={formatCardDateTime(car.updatedAt)}
            />
          </Stack>
        </Group>
      </Stack>
    </Paper>
  );
};
CarGridCard.displayName = "CarGridCard";

export { CarGridCard };
