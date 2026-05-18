import { Button, Group, Title } from "@mantine/core";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { ROUTES } from "@/shared/config/routes-paths";
import { LANG_KEYS } from "@/shared/i18n/keys";

export function TripViewHeader() {
  const { t } = useTranslation();

  return (
    <Group justify="space-between" wrap="nowrap" align="flex-start">
      <Title order={2}>{t(LANG_KEYS.pages.tripViewTitle)}</Title>
      <Button
        component={Link}
        to={ROUTES.dashboard.trips}
        variant="light"
        size="xs"
      >
        {t(LANG_KEYS.pages.tripViewBack)}
      </Button>
    </Group>
  );
}
