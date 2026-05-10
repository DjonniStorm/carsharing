import {
  Alert,
  Button,
  Container,
  Group,
  NumberInput,
  Stack,
  Switch,
  TextInput,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useAction } from "@reatom/react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import type { TariffCreateBody } from "@/entities/tariff";
import { tariffsApi } from "@/features/tariffs/api";
import { loadTariffsCatalog } from "@/features/tariffs/model/tariffs-state";
import { HttpApiError } from "@/shared/api/http-api-error";
import { ROUTES } from "@/shared/config/routes-paths";
import { LANG_KEYS } from "@/shared/i18n/keys";

function parsePrice(value: number | string): number | null {
  const n =
    typeof value === "number" ? value : Number.parseFloat(String(value));
  if (!Number.isFinite(n) || n < 0) {
    return null;
  }
  return Math.round(n * 100) / 100;
}

const TariffCreatePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const reloadTariffs = useAction(loadTariffsCatalog);

  const [name, setName] = useState("");
  const [pricePerMinute, setPricePerMinute] = useState<number | string>(0);
  const [pricePerKm, setPricePerKm] = useState<number | string>(0);
  const [pausePricePerMinute, setPausePricePerMinute] = useState<
    number | string
  >(0);
  const [isDefault, setIsDefault] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const submit = useCallback(async () => {
    setFormError(null);
    const trimmedName = name.trim();
    if (!trimmedName) {
      setFormError(t(LANG_KEYS.pages.tariffsCreateNameRequired));
      return;
    }
    const ppm = parsePrice(pricePerMinute);
    const pk = parsePrice(pricePerKm);
    const pp = parsePrice(pausePricePerMinute);
    if (ppm === null || pk === null || pp === null) {
      setFormError(t(LANG_KEYS.pages.tariffsCreatePricesInvalid));
      return;
    }

    const body: TariffCreateBody = {
      name: trimmedName,
      pricePerMinute: ppm,
      pricePerKm: pk,
      pausePricePerMinute: pp,
      isDefault,
    };

    setSubmitting(true);
    try {
      await tariffsApi.create(body);
      notifications.show({
        title: t(LANG_KEYS.pages.tariffsCreateSuccess),
        color: "green",
      });
      void reloadTariffs({ includeDeleted: true });
      void navigate({ to: ROUTES.dashboard.tariffs });
    } catch (e) {
      const msg =
        e instanceof HttpApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : String(e);
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  }, [
    isDefault,
    name,
    navigate,
    pausePricePerMinute,
    pricePerKm,
    pricePerMinute,
    reloadTariffs,
    t,
  ]);

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

        {formError ? (
          <Alert color="red" onClose={() => setFormError(null)} withCloseButton>
            {formError}
          </Alert>
        ) : null}

        <TextInput
          label={t(LANG_KEYS.pages.tariffsCreateFieldName)}
          value={name}
          onChange={(e) => {
            setName(e.currentTarget.value);
          }}
          required
        />

        <NumberInput
          label={t(LANG_KEYS.pages.tariffsCreateFieldPriceMin)}
          value={pricePerMinute}
          onChange={setPricePerMinute}
          min={0}
          decimalScale={2}
          fixedDecimalScale
        />

        <NumberInput
          label={t(LANG_KEYS.pages.tariffsCreateFieldPriceKm)}
          value={pricePerKm}
          onChange={setPricePerKm}
          min={0}
          decimalScale={2}
          fixedDecimalScale
        />

        <NumberInput
          label={t(LANG_KEYS.pages.tariffsCreateFieldPausePrice)}
          value={pausePricePerMinute}
          onChange={setPausePricePerMinute}
          min={0}
          decimalScale={2}
          fixedDecimalScale
        />

        <Switch
          label={t(LANG_KEYS.pages.tariffsCreateFieldIsDefault)}
          checked={isDefault}
          onChange={(e) => setIsDefault(e.currentTarget.checked)}
        />

        <Button onClick={() => void submit()} loading={submitting}>
          {t(LANG_KEYS.pages.tariffsCreateSubmit)}
        </Button>
      </Stack>
    </Container>
  );
};
TariffCreatePage.displayName = "TariffCreatePage";

export { TariffCreatePage };
