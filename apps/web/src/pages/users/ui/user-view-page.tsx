import {
  Alert,
  Button,
  Container,
  Group,
  Loader,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import type { ReadUser } from "@/entities/user";
import { UserRole } from "@/entities/user";
import { usersApi } from "@/features/auth/api";
import { LANG_KEYS, type LangKey } from "@/shared/i18n/keys";
import { ROUTES } from "@/shared/config/routes-paths";

function roleLangKey(role: UserRole): LangKey {
  switch (role) {
    case UserRole.MANAGER:
      return LANG_KEYS.auth.roleManager;
    case UserRole.DRIVER:
      return LANG_KEYS.auth.roleDriver;
    case UserRole.SYSTEM_ADMIN:
      return LANG_KEYS.auth.roleSystemAdmin;
    default:
      return LANG_KEYS.auth.roleDriver;
  }
}

const UserViewPage = () => {
  const { t } = useTranslation();
  const { userId } = useParams({
    from: "/dashboard/users/$userId",
  });
  const [user, setUser] = useState<ReadUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    void (async () => {
      try {
        const data = await usersApi.findById(userId);
        if (!cancelled) {
          setUser(data);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return (
    <Container size="sm" py="xl">
      <Stack gap="lg">
        <Group justify="space-between">
          <Title order={2}>{t(LANG_KEYS.pages.userViewTitle)}</Title>
          <Button
            component={Link}
            to={ROUTES.dashboard.overview}
            variant="light"
            size="xs"
          >
            {t(LANG_KEYS.pages.userViewBack)}
          </Button>
        </Group>

        {loading ? (
          <Group justify="center" py="xl">
            <Loader />
          </Group>
        ) : error ? (
          <Alert color="red">{error}</Alert>
        ) : user ? (
          <Stack gap="xs">
            <Text size="lg" fw={700}>
              {user.name}
            </Text>
            <Text size="sm">{user.email}</Text>
            <Text size="sm">{user.phone}</Text>
            <Text size="sm" c="dimmed">
              {t(LANG_KEYS.pages.userViewRole)}: {t(roleLangKey(user.role))}
            </Text>
          </Stack>
        ) : null}
      </Stack>
    </Container>
  );
};
UserViewPage.displayName = "UserViewPage";

export { UserViewPage };
