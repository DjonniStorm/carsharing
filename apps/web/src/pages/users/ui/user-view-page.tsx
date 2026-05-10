import {
  Alert,
  Button,
  Container,
  Divider,
  Group,
  Loader,
  Paper,
  ScrollArea,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { Link, useParams } from "@tanstack/react-router";
import { useAction, useAtom } from "@reatom/react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import { UserRole } from "@/entities/user";
import {
  loadUserViewPage,
  resetUserView,
  userViewProfileAtom,
  userViewProfileErrorAtom,
  userViewProfileStatusAtom,
  userViewViolationsAtom,
  userViewViolationsErrorAtom,
  userViewViolationsStatusAtom,
} from "@/features/users/model/user-view";
import { ViolationSummaryCard } from "@/features/violations/ui/violation-summary-card";
import { ROUTES } from "@/shared/config/routes-paths";
import { LANG_KEYS, type LangKey } from "@/shared/i18n/keys";

function roleLangKey(role: UserRole): LangKey {
  const r = Number(role);
  switch (r) {
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

function Row({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  const v =
    value === null || value === undefined || value === "" ? "—" : String(value);
  return (
    <Text size="sm">
      <Text span fw={600}>
        {label}
      </Text>{" "}
      {v}
    </Text>
  );
}

const UserViewPage = () => {
  const { t } = useTranslation();
  const { userId } = useParams({
    from: "/dashboard-shell/dashboard/users/$userId",
  });

  const [user] = useAtom(userViewProfileAtom);
  const [profileStatus] = useAtom(userViewProfileStatusAtom);
  const [profileError] = useAtom(userViewProfileErrorAtom);
  const [driverViolations] = useAtom(userViewViolationsAtom);
  const [violationsStatus] = useAtom(userViewViolationsStatusAtom);
  const [violationsError] = useAtom(userViewViolationsErrorAtom);

  const loadPage = useAction(loadUserViewPage);
  const reset = useAction(resetUserView);

  useEffect(() => {
    reset();
    void loadPage(userId);
    return () => {
      reset();
    };
  }, [userId, loadPage, reset]);

  const loading = profileStatus === "loading" && !user;
  const violationsLoading = violationsStatus === "loading";

  return (
    <Container size="md" py="xl">
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
        ) : profileError ? (
          <Alert color="red">{profileError}</Alert>
        ) : user ? (
          <>
            <Paper p="md" radius="md" withBorder>
              <Stack gap="sm">
                <Text size="sm" fw={700} tt="uppercase" c="dimmed">
                  {t(LANG_KEYS.pages.userViewSectionProfile)}
                </Text>
                <Divider />
                <Text size="lg" fw={700}>
                  {user.name}
                </Text>
                <Row
                  label={t(LANG_KEYS.pages.userViewEmail)}
                  value={user.email}
                />
                <Row
                  label={t(LANG_KEYS.pages.userViewPhone)}
                  value={user.phone}
                />
                <Row
                  label={t(LANG_KEYS.pages.userViewRole)}
                  value={t(roleLangKey(user.role))}
                />
                <Row
                  label={t(LANG_KEYS.pages.userViewAccountStatus)}
                  value={
                    user.isDeleted
                      ? t(LANG_KEYS.pages.userViewDeleted)
                      : user.isActive === false
                        ? t(LANG_KEYS.pages.userViewInactive)
                        : t(LANG_KEYS.pages.userViewActive)
                  }
                />
              </Stack>
            </Paper>

            <Paper p="md" radius="md" withBorder>
              <Stack gap="sm">
                <Text size="sm" fw={700} tt="uppercase" c="dimmed">
                  {t(LANG_KEYS.pages.userViewSectionViolations)}
                </Text>
                <Divider />
                {violationsLoading ? (
                  <Group justify="center" py="md">
                    <Loader size="sm" />
                  </Group>
                ) : violationsError ? (
                  <Alert
                    color="orange"
                    title={t(LANG_KEYS.pages.userViewViolationsLoadError)}
                  >
                    {violationsError}
                  </Alert>
                ) : (
                  <>
                    <Row
                      label={t(LANG_KEYS.pages.userViewViolationsCount)}
                      value={driverViolations.length}
                    />
                    {driverViolations.length === 0 ? (
                      <Text size="sm" c="dimmed">
                        {t(LANG_KEYS.pages.userViewViolationsEmpty)}
                      </Text>
                    ) : (
                      <ScrollArea h={480}>
                        {driverViolations.map((v) => (
                          <ViolationSummaryCard
                            key={v.id}
                            violation={v}
                            showTripLink
                          />
                        ))}
                      </ScrollArea>
                    )}
                  </>
                )}
              </Stack>
            </Paper>
          </>
        ) : null}
      </Stack>
    </Container>
  );
};
UserViewPage.displayName = "UserViewPage";

export { UserViewPage };
