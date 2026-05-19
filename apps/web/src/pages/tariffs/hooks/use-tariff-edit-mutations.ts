import { notifications } from "@mantine/notifications";
import { useAction } from "@reatom/react";
import { useNavigate } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import type { TariffUpdateBody } from "@/entities/tariff";
import {
  firstTariffFormErrorMessage,
  parseTariffFormInput,
  tariffSnapshotFromParsed,
} from "@/features/tariffs/lib/tariff-form-schema";
import type {
  TariffEditLoadPhase,
  TariffEditSnapshot,
} from "@/features/tariffs/model/tariff-edit-view";
import {
  deleteTariffFromEdit,
  refreshTariffsCatalogAfterMutation,
  saveTariffFromEdit,
} from "@/features/tariffs/model/tariffs-state";
import { HttpApiError } from "@/shared/api/http-api-error";
import { ROUTES } from "@/shared/config/routes-paths";
import { LANG_KEYS } from "@/shared/i18n/keys";

type FormSlice = {
  tariffId: string;
  phase: TariffEditLoadPhase;
  isDeleted: boolean;
  name: string;
  pricePerMinute: number | string;
  pricePerKm: number | string;
  pausePricePerMinute: number | string;
  isDefault: boolean;
  snapshot: TariffEditSnapshot | null;
};

export function useTariffEditMutations(form: FormSlice) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const saveTariff = useAction(saveTariffFromEdit);
  const deleteTariff = useAction(deleteTariffFromEdit);
  const refreshCatalog = useAction(refreshTariffsCatalogAfterMutation);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteOpened, setDeleteOpened] = useState(false);

  const {
    tariffId,
    phase,
    isDeleted,
    name,
    pricePerMinute,
    pricePerKm,
    pausePricePerMinute,
    isDefault,
    snapshot,
  } = form;

  const save = useCallback(async () => {
    setFormError(null);
    if (!tariffId || phase !== "ok" || isDeleted) {
      return;
    }

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
    const next = tariffSnapshotFromParsed(parsed.data);

    if (
      snapshot !== null &&
      JSON.stringify(next) === JSON.stringify(snapshot)
    ) {
      notifications.show({
        message: t(LANG_KEYS.pages.tariffsEditNothingToSave),
        color: "blue",
      });
      return;
    }

    const body: TariffUpdateBody = {
      name: next.name,
      pricePerMinute: next.pricePerMinute,
      pricePerKm: next.pricePerKm,
      pausePricePerMinute: next.pausePricePerMinute,
      isDefault: next.isDefault,
    };

    setSubmitting(true);
    try {
      await saveTariff({ id: tariffId, body });
      notifications.show({
        title: t(LANG_KEYS.pages.tariffsEditSuccess),
        message: "",
        color: "green",
      });
      await refreshCatalog();
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
    isDefault,
    isDeleted,
    name,
    navigate,
    pausePricePerMinute,
    phase,
    pricePerKm,
    pricePerMinute,
    refreshCatalog,
    saveTariff,
    snapshot,
    t,
    tariffId,
  ]);

  const confirmDelete = useCallback(async () => {
    setFormError(null);
    if (!tariffId || phase !== "ok" || isDeleted) {
      return;
    }
    setSubmitting(true);
    try {
      const result = await deleteTariff(tariffId);
      setDeleteOpened(false);
      notifications.show({
        title: t(LANG_KEYS.pages.tariffsDeleteSuccess),
        message: "",
        color: result.alreadyDeleted ? "blue" : "green",
      });
      await refreshCatalog();
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
  }, [deleteTariff, isDeleted, navigate, phase, refreshCatalog, t, tariffId]);

  return {
    submitting,
    formError,
    setFormError,
    deleteOpened,
    setDeleteOpened,
    save,
    confirmDelete,
  };
}
