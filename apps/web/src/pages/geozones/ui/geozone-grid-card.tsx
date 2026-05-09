import {
  ActionIcon,
  Badge,
  Box,
  Group,
  Paper,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import { Link } from "@tanstack/react-router";

import type { GeozoneRead } from "@/entities/geozone";
import { geozoneTypeLangKey } from "@/features/geozones/lib/geozone-type-present";
import type { LangKey } from "@/shared/i18n/keys";
import { LANG_KEYS } from "@/shared/i18n/keys";
import { ROUTES } from "@/shared/config/routes-paths";

type Props = {
  zone: GeozoneRead;
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

const GeozoneGridCard = ({ zone, t }: Props) => {
  const typeLabel = t(geozoneTypeLangKey(zone.type));
  const isDeleted = zone.deletedAt != null;

  return (
    <Paper radius="md" p="md" withBorder shadow="xs">
      <Stack gap="sm">
        <Group justify="space-between" align="flex-start" wrap="nowrap" gap="xs">
          <Stack gap={4} style={{ minWidth: 0 }}>
            <Text fw={700} size="lg" truncate="end">
              {zone.name}
            </Text>
            <Text size="xs" c="dimmed" ff="monospace" truncate="end">
              {zone.id}
            </Text>
          </Stack>
          <Tooltip label={t(LANG_KEYS.pages.geozonesEditAria)}>
            <Link
              to={ROUTES.dashboard.geozonesEdit(zone.id)}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <ActionIcon
                component="span"
                variant="light"
                size="lg"
                aria-label={t(LANG_KEYS.pages.geozonesEditAria)}
              >
                <PencilIcon />
              </ActionIcon>
            </Link>
          </Tooltip>
        </Group>

        <Group gap="sm" wrap="nowrap">
          <Badge variant="light">{typeLabel}</Badge>
          {isDeleted ? (
            <Badge color="red" variant="outline" size="sm">
              {t(LANG_KEYS.pages.geozonesCardDeleted)}
            </Badge>
          ) : null}
        </Group>

        <Group gap={8} wrap="nowrap">
          <Box
            style={{
              width: 20,
              height: 20,
              borderRadius: 6,
              background: zone.color || "var(--mantine-color-gray-5)",
              flexShrink: 0,
              border: "1px solid var(--mantine-color-default-border)",
            }}
          />
          <Text size="sm" c="dimmed" truncate="end">
            {zone.color}
          </Text>
        </Group>

        {zone.currentVersionId ? (
          <Text size="xs" c="dimmed">
            {t(LANG_KEYS.pages.geozonesCardVersion)}:{" "}
            <Text span ff="monospace">
              {zone.currentVersionId}
            </Text>
          </Text>
        ) : (
          <Text size="xs" c="dimmed">
            {t(LANG_KEYS.pages.geozonesCardNoVersion)}
          </Text>
        )}
      </Stack>
    </Paper>
  );
};
GeozoneGridCard.displayName = "GeozoneGridCard";

export { GeozoneGridCard };
