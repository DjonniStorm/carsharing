import {
  Alert,
  Badge,
  Button,
  Center,
  Container,
  Group,
  Loader,
  Select,
  Stack,
  Text,
  Textarea,
  Title,
} from "@mantine/core";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { ViolationStatus } from "@/entities/violation";
import {
  buildViolationStatusSelectData,
  violationStatusLangKey,
} from "@/features/violations/lib/violation-status-present";
import { ROUTES } from "@/shared/config/routes-paths";
import { LANG_KEYS } from "@/shared/i18n/keys";

import { useViolationEditPage } from "@/pages/violations/hooks/use-violation-edit-page";

const ViolationEditPage = () => {
  const { t } = useTranslation();
  const vm = useViolationEditPage();
  const statusSelectData = buildViolationStatusSelectData(t);

  if (vm.phase === "loading") {
    return (
      <Container size="sm" py="xl">
        <Center>
          <Stack align="center" gap="md">
            <Loader />
            <Text c="dimmed">{t(LANG_KEYS.pages.violationsLoading)}</Text>
          </Stack>
        </Center>
      </Container>
    );
  }

  if (vm.phase === "error") {
    return (
      <Container size="sm" py="md" px="md">
        <Stack gap="md">
          <Title order={2}>
            {t(LANG_KEYS.pages.violationsEditorEditTitle)}
          </Title>
          <Alert color="red">{vm.loadError}</Alert>
          <Link
            to={ROUTES.dashboard.violations}
            style={{ textDecoration: "none" }}
          >
            <Button component="span" variant="light">
              {t(LANG_KEYS.pages.violationsCreateCancel)}
            </Button>
          </Link>
        </Stack>
      </Container>
    );
  }

  const isResolved = vm.statusChoice === ViolationStatus.RESOLVED;

  return (
    <Container size="sm" py="md" px="md">
      <Stack gap="lg">
        <Group justify="space-between" align="flex-start">
          <Stack gap={4}>
            <Title order={2}>
              {t(LANG_KEYS.pages.violationsEditorEditTitle)}
            </Title>
            <Text size="sm" ff="monospace" c="dimmed">
              {vm.violationId}
            </Text>
          </Stack>
          <Link
            to={ROUTES.dashboard.violations}
            style={{ textDecoration: "none" }}
          >
            <Button component="span" variant="default">
              {t(LANG_KEYS.pages.violationsCreateCancel)}
            </Button>
          </Link>
        </Group>

        {vm.formError ? (
          <Alert
            color="red"
            onClose={() => vm.setFormError(null)}
            withCloseButton
          >
            {vm.formError}
          </Alert>
        ) : null}

        <Stack gap={6}>
          <Text size="sm" fw={600}>
            {t(LANG_KEYS.pages.violationsEditTripReadonly)}
          </Text>
          <Text ff="monospace" size="sm">
            {vm.tripId}
          </Text>
        </Stack>

        <Stack gap={6}>
          <Text size="sm" fw={600}>
            {t(LANG_KEYS.pages.violationsEditDescReadonly)}
          </Text>
          <Textarea value={vm.description} readOnly autosize minRows={3} />
        </Stack>

        <Stack gap="xs">
          <Text size="sm" fw={600}>
            {t(LANG_KEYS.pages.violationsEditCurrentStatus)}
          </Text>
          <Badge size="lg" variant="light">
            {vm.persistedStatus !== null
              ? t(violationStatusLangKey(vm.persistedStatus))
              : t(violationStatusLangKey(vm.statusChoice))}
          </Badge>
        </Stack>

        <Select
          label={t(LANG_KEYS.pages.violationsEditNewStatus)}
          data={statusSelectData}
          value={String(vm.statusChoice)}
          onChange={(v) => {
            if (v !== null) {
              vm.setStatusChoice(Number(v) as ViolationStatus);
            }
          }}
        />

        <Group gap="sm" wrap="wrap">
          <Button onClick={() => void vm.saveStatus()} loading={vm.submitting}>
            {t(LANG_KEYS.pages.violationsEditSaveStatus)}
          </Button>
          <Button
            variant="light"
            color="green"
            onClick={() => void vm.markResolved()}
            loading={vm.submitting}
            disabled={isResolved}
          >
            {t(LANG_KEYS.pages.violationsEditResolve)}
          </Button>
        </Group>
      </Stack>
    </Container>
  );
};
ViolationEditPage.displayName = "ViolationEditPage";

export { ViolationEditPage };
