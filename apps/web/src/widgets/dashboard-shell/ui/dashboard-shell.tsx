import {
  AppShell,
  Burger,
  Button,
  Divider,
  Group,
  NavLink,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useAction, useAtom } from "@reatom/react";
import {
  Link,
  Outlet,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { accessTokenAtom, clearSession } from "@/features/auth/model/session";
import { ROUTES } from "@/shared/config/routes-paths";
import type { LangKey } from "@/shared/i18n/keys";
import { LANG_KEYS } from "@/shared/i18n/keys";

export type DashboardShellNavItem = {
  labelKey: LangKey;
  to: string;
};

type Props = {
  navItems: readonly DashboardShellNavItem[];
};

const DashboardShell = ({ navItems }: Props) => {
  const { t } = useTranslation();
  const [opened, { toggle, close }] = useDisclosure();
  const pathname = useRouterState({
    select: (s) => {
      return s.location.pathname;
    },
  });
  const [token] = useAtom(accessTokenAtom);
  const logout = useAction(clearSession);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate({ to: ROUTES.login, search: { redirect: undefined } });
  };

  const navLinkNodes = navItems.map((item) => {
    return (
      <NavLink
        key={item.to}
        component={Link}
        to={item.to}
        label={t(item.labelKey)}
        active={pathname === item.to}
        onClick={() => {
          close();
        }}
        styles={{
          root: {
            borderRadius: "var(--mantine-radius-md)",
          },
          label: {
            fontWeight: pathname === item.to ? 600 : 500,
          },
        }}
      />
    );
  });

  return (
    <AppShell
      header={{ height: 56 }}
      navbar={{
        width: 280,
        breakpoint: "sm",
        collapsed: { mobile: !opened },
      }}
      padding={0}
      styles={{
        root: {
          minHeight: "100dvh",
        },
      }}
    >
      <AppShell.Header px="md">
        <Group h="100%" justify="space-between">
          <Group>
            <Burger
              opened={opened}
              onClick={toggle}
              hiddenFrom="sm"
              size="sm"
            />
            <Title order={4}>{t(LANG_KEYS.brand.name)}</Title>
          </Group>
          <Group gap="sm" visibleFrom="sm">
            {token ? (
              <>
                <Text size="sm" c="dimmed" visibleFrom="md">
                  {t(LANG_KEYS.shell.sessionActive)}
                </Text>
                <Button
                  variant="light"
                  size="compact-sm"
                  onClick={handleLogout}
                >
                  {t(LANG_KEYS.shell.logout)}
                </Button>
              </>
            ) : (
              <>
                <NavLink
                  component={Link}
                  to={ROUTES.login}
                  label={t(LANG_KEYS.shell.login)}
                  style={{ width: "auto" }}
                  variant="subtle"
                />
                <NavLink
                  component={Link}
                  to={ROUTES.register}
                  label={t(LANG_KEYS.shell.register)}
                  style={{ width: "auto" }}
                  variant="light"
                />
              </>
            )}
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <Stack
          justify="space-between"
          gap="lg"
          style={{ height: "100%", minHeight: 0 }}
        >
          <Stack gap="md">
            <div>
              <Text size="xs" tt="uppercase" fw={700} c="dimmed" mb={6}>
                {t(LANG_KEYS.shell.fleetSectionTitle)}
              </Text>
              <Text size="xs" c="dimmed" mb="sm">
                {t(LANG_KEYS.shell.fleetSectionSubtitle)}
              </Text>
              <Stack gap={4}>{navLinkNodes}</Stack>
            </div>

            <Stack gap={4} hiddenFrom="sm">
              <Divider />
              {token ? (
                <Button variant="light" fullWidth onClick={handleLogout}>
                  {t(LANG_KEYS.shell.logout)}
                </Button>
              ) : (
                <>
                  <NavLink
                    component={Link}
                    to={ROUTES.login}
                    label={t(LANG_KEYS.shell.login)}
                    variant="subtle"
                    onClick={() => {
                      close();
                    }}
                  />
                  <NavLink
                    component={Link}
                    to={ROUTES.register}
                    label={t(LANG_KEYS.shell.register)}
                    variant="light"
                    onClick={close}
                  />
                </>
              )}
            </Stack>
          </Stack>
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
};
DashboardShell.displayName = "DashboardShell";

export { DashboardShell };
