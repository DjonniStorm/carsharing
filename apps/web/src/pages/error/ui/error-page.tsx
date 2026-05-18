import {
  Button,
  Container,
  Group,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import { Link, useSearch } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { ACCESS_TOKEN_STORAGE_KEY } from "@/features/auth/config/token-storage";
import { ROUTES } from "@/shared/config/routes-paths";
import type { LangKey } from "@/shared/i18n/keys";
import { LANG_KEYS } from "@/shared/i18n/keys";

type ErrorSearch = {
  reason?: string;
};

function bodyKeyForReason(reason: string | undefined): LangKey {
  switch (reason) {
    case "session":
      return LANG_KEYS.pages.errorSessionBody;
    case "trip_invalid_id":
      return LANG_KEYS.pages.errorTripInvalidIdBody;
    case "trip_not_found":
      return LANG_KEYS.pages.errorTripNotFoundBody;
    case "trip_forbidden":
      return LANG_KEYS.pages.errorTripForbiddenBody;
    case "not_found":
      return LANG_KEYS.pages.errorNotFoundBody;
    default:
      return reason
        ? LANG_KEYS.pages.errorGenericBody
        : LANG_KEYS.pages.errorUnknownBody;
  }
}

type ErrorPageProps = {
  reasonOverride?: string;
};

const ErrorPage = ({ reasonOverride }: ErrorPageProps = {}) => {
  const { t } = useTranslation();
  const search = useSearch({ strict: false }) as ErrorSearch;
  const reason = reasonOverride ?? search.reason;
  const hasToken =
    typeof localStorage !== "undefined" &&
    Boolean(localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY));

  const bodyKey = bodyKeyForReason(reason);

  return (
    <Container size="sm" py="xl">
      <Stack gap="lg" align="flex-start">
        <ThemeIcon size={56} radius="md" variant="light" color="red">
          <Text fw={700} fz={28} lh={1}>
            !
          </Text>
        </ThemeIcon>
        <Title order={2}>{t(LANG_KEYS.pages.errorTitle)}</Title>
        <Text>{t(bodyKey)}</Text>
        {reason ? (
          <Text size="xs" c="dimmed" ff="monospace">
            {reason}
          </Text>
        ) : null}
        <Group gap="sm">
          <Button component={Link} to={ROUTES.home} variant="default">
            {t(LANG_KEYS.pages.errorBackHome)}
          </Button>
          {hasToken ? (
            <Button
              component={Link}
              to={ROUTES.dashboard.overview}
              variant="light"
            >
              {t(LANG_KEYS.pages.errorBackDashboard)}
            </Button>
          ) : (
            <Button component={Link} to={ROUTES.login} variant="light">
              {t(LANG_KEYS.pages.errorBackLogin)}
            </Button>
          )}
        </Group>
      </Stack>
    </Container>
  );
};
ErrorPage.displayName = "ErrorPage";

export { ErrorPage };
