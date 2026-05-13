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

import type { ViolationRead } from "@/entities/violation";
import { violationStatusLangKey } from "@/features/violations/lib/violation-status-present";
import type { LangKey } from "@/shared/i18n/keys";
import { LANG_KEYS } from "@/shared/i18n/keys";
import { ROUTES } from "@/shared/config/routes-paths";

type Props = {
  violation: ViolationRead;
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

const ViolationGridCard = ({ violation, t }: Props) => {
  const kindLabel = t(violationStatusLangKey(violation.type));

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
              {kindLabel}
            </Badge>
            <Text size="xs" c="dimmed" ff="monospace" truncate="end">
              {violation.id}
            </Text>
            <Text size="sm" fw={600} truncate="end">
              {t(LANG_KEYS.pages.violationsColTrip)}:{" "}
              <Link
                to={ROUTES.dashboard.tripView(violation.tripId)}
                style={{
                  fontFamily: "var(--mantine-font-family-monospace)",
                  fontWeight: 500,
                  textDecoration: "underline",
                }}
              >
                {violation.tripId}
              </Link>
            </Text>
          </Stack>
          <Tooltip label={t(LANG_KEYS.pages.violationsEditAria)}>
            <Link
              to={ROUTES.dashboard.violationsEdit(violation.id)}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <ActionIcon
                component="span"
                variant="light"
                size="lg"
                aria-label={t(LANG_KEYS.pages.violationsEditAria)}
              >
                <PencilIcon />
              </ActionIcon>
            </Link>
          </Tooltip>
        </Group>

        <Text size="sm" lineClamp={4}>
          {violation.description}
        </Text>

        <Text size="xs" c="dimmed">
          {t(LANG_KEYS.pages.violationsColCreated)}:{" "}
          {new Date(violation.createdAt).toLocaleString()}
        </Text>
      </Stack>
    </Paper>
  );
};
ViolationGridCard.displayName = "ViolationGridCard";

export { ViolationGridCard };
