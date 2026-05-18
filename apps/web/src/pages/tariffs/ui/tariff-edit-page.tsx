import {
  Alert,
  Button,
  Center,
  Container,
  Group,
  Loader,
  Modal,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { ROUTES } from "@/shared/config/routes-paths";
import { LANG_KEYS } from "@/shared/i18n/keys";

import { useTariffEditPage } from "@/pages/tariffs/hooks/use-tariff-edit-page";
import { TariffFormFields } from "@/pages/tariffs/ui/tariff-form-fields";

const TariffEditPage = () => {
  const { t } = useTranslation();
  const vm = useTariffEditPage();

  if (vm.phase === "loading") {
    return (
      <Container size="sm" py="xl">
        <Center>
          <Stack align="center" gap="md">
            <Loader />
            <Text c="dimmed">{t(LANG_KEYS.pages.tariffsEditLoading)}</Text>
          </Stack>
        </Center>
      </Container>
    );
  }

  if (vm.phase === "error") {
    return (
      <Container size="sm" py="md" px="md">
        <Stack gap="md">
          <Title order={2}>{t(LANG_KEYS.pages.tariffsEditorEditTitle)}</Title>
          <Alert color="red">{vm.loadError}</Alert>
          <Link
            to={ROUTES.dashboard.tariffs}
            style={{ textDecoration: "none" }}
          >
            <Button component="span" variant="light">
              {t(LANG_KEYS.pages.tariffsCreateCancel)}
            </Button>
          </Link>
        </Stack>
      </Container>
    );
  }

  return (
    <Container size="sm" py="md" px="md">
      <Stack gap="lg">
        <Group justify="space-between" align="flex-start">
          <Title order={2}>{t(LANG_KEYS.pages.tariffsEditorEditTitle)}</Title>
          <Link
            to={ROUTES.dashboard.tariffs}
            style={{ textDecoration: "none" }}
          >
            <Button component="span" variant="default">
              {t(LANG_KEYS.pages.tariffsCreateCancel)}
            </Button>
          </Link>
        </Group>

        {vm.isDeleted ? (
          <Alert color="gray">
            {t(LANG_KEYS.pages.tariffsEditDeletedHint)}
          </Alert>
        ) : null}

        {vm.formError ? (
          <Alert
            color="red"
            onClose={() => vm.setFormError(null)}
            withCloseButton
          >
            {vm.formError}
          </Alert>
        ) : null}

        <TariffFormFields
          values={{
            name: vm.name,
            pricePerMinute: vm.pricePerMinute,
            pricePerKm: vm.pricePerKm,
            pausePricePerMinute: vm.pausePricePerMinute,
            isDefault: vm.isDefault,
          }}
          readOnly={vm.isDeleted}
          onNameChange={vm.setName}
          onPricePerMinuteChange={vm.setPricePerMinute}
          onPricePerKmChange={vm.setPricePerKm}
          onPausePricePerMinuteChange={vm.setPausePricePerMinute}
          onIsDefaultChange={vm.setIsDefault}
        />

        <Group gap="sm" wrap="wrap">
          <Button
            onClick={() => void vm.save()}
            loading={vm.submitting}
            disabled={vm.isDeleted}
          >
            {t(LANG_KEYS.pages.tariffsEditSave)}
          </Button>
          <Button
            variant="outline"
            color="red"
            onClick={() => vm.setDeleteOpened(true)}
            disabled={vm.isDeleted || vm.submitting}
          >
            {t(LANG_KEYS.pages.tariffsEditDelete)}
          </Button>
        </Group>
      </Stack>

      <Modal
        opened={vm.deleteOpened}
        onClose={() => vm.setDeleteOpened(false)}
        title={t(LANG_KEYS.pages.tariffsEditDeleteConfirmTitle)}
      >
        <Stack gap="md">
          <Text size="sm">
            {t(LANG_KEYS.pages.tariffsEditDeleteConfirmBody)}
          </Text>
          <Group justify="flex-end" gap="sm">
            <Button variant="default" onClick={() => vm.setDeleteOpened(false)}>
              {t(LANG_KEYS.pages.tariffsCreateCancel)}
            </Button>
            <Button
              color="red"
              loading={vm.submitting}
              onClick={() => void vm.confirmDelete()}
            >
              {t(LANG_KEYS.pages.tariffsEditDelete)}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
};
TariffEditPage.displayName = "TariffEditPage";

export { TariffEditPage };
