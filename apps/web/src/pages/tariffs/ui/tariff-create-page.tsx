import {
  Alert,
  Button,
  Container,
  Group,
  Stack,
  Title,
} from "@mantine/core";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { ROUTES } from "@/shared/config/routes-paths";
import { LANG_KEYS } from "@/shared/i18n/keys";

import { useTariffCreateSubmit } from "@/pages/tariffs/hooks/use-tariff-create-submit";
import { TariffFormFields } from "@/pages/tariffs/ui/tariff-form-fields";

const TariffCreatePage = () => {
  const { t } = useTranslation();
  const form = useTariffCreateSubmit();

  return (
    <Container size="sm" py="md" px="md">
      <Stack gap="lg">
        <Group justify="space-between" align="flex-start">
          <Title order={2}>{t(LANG_KEYS.pages.tariffsEditorNewTitle)}</Title>
          <Link
            to={ROUTES.dashboard.tariffs}
            style={{ textDecoration: "none" }}
          >
            <Button component="span" variant="default">
              {t(LANG_KEYS.pages.tariffsCreateCancel)}
            </Button>
          </Link>
        </Group>

        {form.formError ? (
          <Alert color="red" onClose={() => form.setFormError(null)} withCloseButton>
            {form.formError}
          </Alert>
        ) : null}

        <TariffFormFields
          values={{
            name: form.name,
            pricePerMinute: form.pricePerMinute,
            pricePerKm: form.pricePerKm,
            pausePricePerMinute: form.pausePricePerMinute,
            isDefault: form.isDefault,
          }}
          onNameChange={form.setName}
          onPricePerMinuteChange={form.setPricePerMinute}
          onPricePerKmChange={form.setPricePerKm}
          onPausePricePerMinuteChange={form.setPausePricePerMinute}
          onIsDefaultChange={form.setIsDefault}
        />

        <Button onClick={() => void form.submit()} loading={form.submitting}>
          {t(LANG_KEYS.pages.tariffsCreateSubmit)}
        </Button>
      </Stack>
    </Container>
  );
};
TariffCreatePage.displayName = "TariffCreatePage";

export { TariffCreatePage };
