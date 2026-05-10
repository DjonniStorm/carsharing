import {
  ActionIcon,
  Badge,
  Group,
  Paper,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import { Link } from "@tanstack/react-router";

import type { TariffRead } from "@/entities/tariff";
import type { LangKey } from "@/shared/i18n/keys";
import { LANG_KEYS } from "@/shared/i18n/keys";
import { ROUTES } from "@/shared/config/routes-paths";

type Props = {
  tariff: TariffRead;
  t: (key: LangKey) => string;
};

const PencilIcon = () => (
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
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
  </svg>
);

const TariffGridCard = ({ tariff, t }: Props) => {
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
            <Text fw={700} size="lg" truncate="end">
              {tariff.name}
            </Text>
            <Text size="xs" c="dimmed" ff="monospace" truncate="end">
              {tariff.id}
            </Text>
          </Stack>
          <Tooltip label={t(LANG_KEYS.pages.tariffsEditAria)}>
            <Link
              to={ROUTES.dashboard.tariffsEdit(tariff.id)}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <ActionIcon
                component="span"
                variant="light"
                size="lg"
                aria-label={t(LANG_KEYS.pages.tariffsEditAria)}
              >
                <PencilIcon />
              </ActionIcon>
            </Link>
          </Tooltip>
        </Group>

        <Group gap="sm" wrap="wrap">
          {tariff.isDefault ? (
            <Badge color="teal" variant="light" size="sm">
              {t(LANG_KEYS.pages.tariffsBadgeDefault)}
            </Badge>
          ) : null}
          {tariff.isDeleted ? (
            <Badge color="red" variant="outline" size="sm">
              {t(LANG_KEYS.pages.tariffsCardDeleted)}
            </Badge>
          ) : null}
        </Group>

        <Group gap="md" wrap="wrap">
          <Text size="sm" c="dimmed">
            {t(LANG_KEYS.pages.tariffsColPriceMin)}:{" "}
            <Text span c="var(--mantine-color-text)" fw={500}>
              {tariff.pricePerMinute}
            </Text>
          </Text>
          <Text size="sm" c="dimmed">
            {t(LANG_KEYS.pages.tariffsColPriceKm)}:{" "}
            <Text span c="var(--mantine-color-text)" fw={500}>
              {tariff.pricePerKm}
            </Text>
          </Text>
          <Text size="sm" c="dimmed">
            {t(LANG_KEYS.pages.tariffsColPausePrice)}:{" "}
            <Text span c="var(--mantine-color-text)" fw={500}>
              {tariff.pausePricePerMinute}
            </Text>
          </Text>
        </Group>

        <Text size="xs" c="dimmed">
          {t(LANG_KEYS.pages.tariffsColUpdated)}: {tariff.updatedAt}
        </Text>
      </Stack>
    </Paper>
  );
};
TariffGridCard.displayName = "TariffGridCard";

export { TariffGridCard };
