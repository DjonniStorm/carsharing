import { ActionIcon, Badge, Button, Card, Text } from "@mantine/core";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import type { ViolationRead } from "@/entities/violation";
import {
  VIOLATION_STATUSES_ORDERED,
  violationStatusLangKey,
} from "@/features/violations/lib/violation-status-present";
import { ROUTES } from "@/shared/config/routes-paths";
import { LANG_KEYS } from "@/shared/i18n/keys";

function PencilGlyph({ size = 18 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </svg>
  );
}
export type ViolationSummaryCardProps = {
  violation: ViolationRead;
  /** Показать ссылку на карточку поездки (для списка по водителю). */
  showTripLink?: boolean;
  /** Ссылка на редактирование нарушения в новой вкладке (для менеджера). */
  showEditInNewTab?: boolean;
};

const ViolationSummaryCard = ({
  violation: v,
  showTripLink = false,
  showEditInNewTab = false,
}: ViolationSummaryCardProps) => {
  const { t } = useTranslation();

  return (
    <Card
      p="md"
      m="md"
      radius="md"
      withBorder
      pos="relative"
      pr={showEditInNewTab ? 44 : undefined}
    >
      {showEditInNewTab ? (
        <ActionIcon
          component={Link}
          to={ROUTES.dashboard.violationsEdit(v.id)}
          target="_blank"
          rel="noopener noreferrer"
          variant="subtle"
          color="gray"
          size="sm"
          radius="md"
          pos="absolute"
          top={10}
          right={10}
          aria-label={t(LANG_KEYS.pages.tripDetailViolationOpenEditNewTab)}
        >
          <PencilGlyph />
        </ActionIcon>
      ) : null}
      <Badge variant="light" size="lg">
        <Text size="sm" fw={600}>
          {VIOLATION_STATUSES_ORDERED.includes(v.type)
            ? t(violationStatusLangKey(v.type))
            : String(v.type)}
        </Text>
      </Badge>
      <Text size="xs" c="dimmed" fz="lg">
        {t(LANG_KEYS.pages.tripDetailViolationAt)}{" "}
        {new Date(v.createdAt).toLocaleString()}
      </Text>
      <Text size="sm">{v.description}</Text>
      {showTripLink ? (
        <Button
          component={Link}
          to={ROUTES.dashboard.tripView(v.tripId)}
          variant="subtle"
          size="xs"
          mt="xs"
          px={0}
        >
          {t(LANG_KEYS.pages.userViewViolationTripLink)}
        </Button>
      ) : null}
    </Card>
  );
};
ViolationSummaryCard.displayName = "ViolationSummaryCard";

export { PencilGlyph, ViolationSummaryCard };
