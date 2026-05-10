import { Button, Container, Stack, Text, Title } from "@mantine/core";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { ROUTES } from "@/shared/config/routes-paths";
import { LANG_KEYS } from "@/shared/i18n/keys";

const PublicHomePage = () => {
  const { t } = useTranslation();

  return (
    <Container size="sm" py="xl">
      <Stack gap="lg" align="flex-start">
        <Title order={1}>{t(LANG_KEYS.pages.publicHomeTitle)}</Title>
        <Text c="dimmed">{t(LANG_KEYS.pages.publicHomeSubtitle)}</Text>
        <Stack gap="sm">
          <Button component={Link} to={ROUTES.login}>
            {t(LANG_KEYS.shell.login)}
          </Button>
          <Button component={Link} to={ROUTES.register} variant="light">
            {t(LANG_KEYS.shell.register)}
          </Button>
        </Stack>
      </Stack>
    </Container>
  );
};
PublicHomePage.displayName = "PublicHomePage";

export { PublicHomePage };
