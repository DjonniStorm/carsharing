import { notifications } from "@mantine/notifications";
import { useAction } from "@reatom/react";
import { useNavigate } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import type { TariffCreateBody } from "@/entities/tariff";
import {
  firstTariffFormErrorMessage,
  parseTariffFormInput,
  tariffSnapshotFromParsed,
} from "@/features/tariffs/lib/tariff-form-schema";
import { createTariffInCatalog } from "@/features/tariffs/model/tariffs-state";
import { HttpApiError } from "@/shared/api/http-api-error";
import { ROUTES } from "@/shared/config/routes-paths";
import { LANG_KEYS } from "@/shared/i18n/keys";

export function useTariffCreateSubmit() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const createTariff = useAction(createTariffInCatalog);

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
    const parsed = parseTariffFormInput({
      name,
      pricePerMinute,
      pricePerKm,
      pausePricePerMinute,
      isDefault,
    });
    if (!parsed.success) {
      setFormError(firstTariffFormErrorMessage(parsed));
      return;
    }
    const snapshot = tariffSnapshotFromParsed(parsed.data);

    const body: TariffCreateBody = {
      name: snapshot.name,
      pricePerMinute: snapshot.pricePerMinute,
      pricePerKm: snapshot.pricePerKm,
      pausePricePerMinute: snapshot.pausePricePerMinute,
      isDefault: snapshot.isDefault,
    };

    setSubmitting(true);
    try {
      await createTariff(body);
      notifications.show({
        title: t(LANG_KEYS.pages.tariffsCreateSuccess),
        message: "",
        color: "green",
      });
      await navigate({ to: ROUTES.dashboard.tariffs });
    } catch (error) {
      const msg =
        error instanceof HttpApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : String(error);
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  }, [
    createTariff,
    isDefault,
    name,
    navigate,
    pausePricePerMinute,
    pricePerKm,
    pricePerMinute,
    t,
  ]);

  return {
    name,
    setName,
    pricePerMinute,
    setPricePerMinute,
    pricePerKm,
    setPricePerKm,
    pausePricePerMinute,
    setPausePricePerMinute,
    isDefault,
    setIsDefault,
    submitting,
    formError,
    setFormError,
    submit,
  };
}
