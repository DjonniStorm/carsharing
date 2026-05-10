import { Button, Container, Stack, Text, Title } from "@mantine/core";
import { Link, useSearch } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { ROUTES } from "@/shared/config/routes-paths";
import { LANG_KEYS } from "@/shared/i18n/keys";

const ErrorPage = () => {
  const { t } = useTranslation();
  const { reason } = useSearch({ strict: false }) as {
    reason?: string;
  };

  const bodyKey =
    reason === "session"
      ? LANG_KEYS.pages.errorSessionBody
      : reason === "trip_invalid_id"
        ? LANG_KEYS.pages.errorTripInvalidIdBody
        : reason === "trip_not_found"
          ? LANG_KEYS.pages.errorTripNotFoundBody
          : reason === "trip_forbidden"
            ? LANG_KEYS.pages.errorTripForbiddenBody
            : LANG_KEYS.pages.errorGenericBody;

  return (
    <Container size="sm" py="xl">
      <Stack gap="lg" align="flex-start">
        <Title order={2}>{t(LANG_KEYS.pages.errorTitle)}</Title>
        <Text>{t(bodyKey)}</Text>
        <Button component={Link} to={ROUTES.home}>
          {t(LANG_KEYS.pages.errorBackHome)}
        </Button>
      </Stack>
    </Container>
  );
};
ErrorPage.displayName = "ErrorPage";

export { ErrorPage };
