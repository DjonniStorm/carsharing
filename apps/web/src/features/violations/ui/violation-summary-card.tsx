import { Badge, Button, Card, Text } from "@mantine/core";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import type { ViolationRead } from "@/entities/violation";
import {
  VIOLATION_STATUSES_ORDERED,
  violationStatusLangKey,
} from "@/features/violations/lib/violation-status-present";
import { ROUTES } from "@/shared/config/routes-paths";
import { LANG_KEYS } from "@/shared/i18n/keys";

export type ViolationSummaryCardProps = {
  violation: ViolationRead;
  /** Показать ссылку на карточку поездки (для списка по водителю). */
  showTripLink?: boolean;
};

const ViolationSummaryCard = ({
  violation: v,
  showTripLink = false,
}: ViolationSummaryCardProps) => {
  const { t } = useTranslation();

  return (
    <Card p="md" m="md" radius="md" withBorder>
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

export { ViolationSummaryCard };
