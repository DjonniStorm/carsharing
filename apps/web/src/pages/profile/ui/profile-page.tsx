import {
  Button,
  Container,
  Group,
  Modal,
  Paper,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { useAction, useAtom } from "@reatom/react";
import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { authApi } from "@/features/auth/api";
import {
  sessionProfileAtom,
  setSessionProfile,
} from "@/features/auth/model/session";
import { ShellLanguageControl } from "@/widgets/dashboard-shell/ui/shell-language-control";
import { ROUTES } from "@/shared/config/routes-paths";
import { LANG_KEYS } from "@/shared/i18n/keys";

const ProfilePage = () => {
  const { t } = useTranslation();
  const [profile] = useAtom(sessionProfileAtom);
  const applyProfile = useAction(setSessionProfile);
  const [opened, { open, close }] = useDisclosure(false);
  const [draftName, setDraftName] = useState(profile?.name ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile?.name !== undefined) {
      setDraftName(profile.name);
    }
  }, [profile?.name]);

  const handleSaveName = async () => {
    const name = draftName.trim();
    if (!name) {
      return;
    }
    setSaving(true);
    try {
      const updated = await authApi.patchMe({ name });
      applyProfile(updated);
      notifications.show({
        title: t(LANG_KEYS.pages.profileNameSavedTitle),
        message: t(LANG_KEYS.pages.profileNameSavedBody),
        color: "green",
      });
      close();
    } catch (e) {
      notifications.show({
        title: t(LANG_KEYS.pages.profileNameErrorTitle),
        message: e instanceof Error ? e.message : String(e),
        color: "red",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Container size="sm" py="xl">
      <Stack gap="lg">
        <Group justify="space-between">
          <Title order={2}>{t(LANG_KEYS.pages.profileTitle)}</Title>
          <Button
            component={Link}
            to={ROUTES.dashboard.overview}
            variant="light"
            size="xs"
          >
            {t(LANG_KEYS.pages.profileBackDashboard)}
          </Button>
        </Group>

        <Paper p="md" radius="md" withBorder>
          <Stack gap="md">
            <div>
              <Text size="sm" c="dimmed">
                {t(LANG_KEYS.pages.profileNameLabel)}
              </Text>
              <Text size="lg" fw={600}>
                {profile?.name ?? "—"}
              </Text>
            </div>
            <div>
              <Text size="sm" c="dimmed">
                {t(LANG_KEYS.pages.profileEmailLabel)}
              </Text>
              <Text size="sm">{profile?.email ?? "—"}</Text>
            </div>
            <Button variant="light" onClick={open}>
              {t(LANG_KEYS.pages.profileEditName)}
            </Button>
          </Stack>
        </Paper>

        <Paper p="md" radius="md" withBorder>
          <Stack gap="sm">
            <Text size="sm" fw={700}>
              {t(LANG_KEYS.pages.profileLanguageSection)}
            </Text>
            <ShellLanguageControl />
          </Stack>
        </Paper>
      </Stack>

      <Modal
        opened={opened}
        onClose={close}
        title={t(LANG_KEYS.pages.profileNameModalTitle)}
      >
        <Stack gap="md">
          <TextInput
            label={t(LANG_KEYS.auth.name)}
            value={draftName}
            onChange={(e) => {
              setDraftName(e.currentTarget.value);
            }}
            placeholder={t(LANG_KEYS.auth.namePlaceholder)}
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={close}>
              {t(LANG_KEYS.pages.profileCancel)}
            </Button>
            <Button loading={saving} onClick={handleSaveName}>
              {t(LANG_KEYS.pages.profileSaveName)}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
};
ProfilePage.displayName = "ProfilePage";

export { ProfilePage };
