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

import type { CarRead } from "@/entities/car";
import {
  carStatusBadgeColor,
  carStatusLangKey,
} from "@/features/cars/lib/car-status-present";
import type { LangKey } from "@/shared/i18n/keys";
import { LANG_KEYS } from "@/shared/i18n/keys";

type Props = {
  car: CarRead;
  t: (key: LangKey) => string;
};

const CarGridCard = ({ car, t }: Props) => {
  const statusLabel = t(carStatusLangKey(car.carStatus));

  return (
    <Paper radius="md" p="md" withBorder shadow="xs">
      <Stack gap="sm">
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <Stack gap={2} style={{ minWidth: 0 }}>
            <Text fw={700} size="lg" truncate="end">
              {car.licensePlate}
            </Text>
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
          <Badge color={carStatusBadgeColor(car.carStatus)} variant="light">
            {statusLabel}
          </Badge>
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

          <Stack gap={6} style={{ flex: 1 }}>
            <Text size="sm">
              <Text span c="dimmed">
                {t(LANG_KEYS.pages.carsCardMileage)}
              </Text>{" "}
              <Text span fw={500}>
                {car.mileage.toLocaleString()}
              </Text>
            </Text>
            <Text size="sm" style={{ wordBreak: "break-word" }}>
              <Text span c="dimmed">
                {t(LANG_KEYS.pages.carsColPosition)}
              </Text>{" "}
              <Text span>
                {car.lastKnownLon != null && car.lastKnownLat != null
                  ? `${car.lastKnownLat.toFixed(4)}, ${car.lastKnownLon.toFixed(4)}`
                  : "—"}
              </Text>
            </Text>
          </Stack>
        </Group>
      </Stack>
    </Paper>
  );
};
CarGridCard.displayName = "CarGridCard";

export { CarGridCard };
