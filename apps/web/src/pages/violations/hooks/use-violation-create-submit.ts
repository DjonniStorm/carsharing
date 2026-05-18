import { notifications } from "@mantine/notifications";
import { useAction } from "@reatom/react";
import { useNavigate } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import { ViolationStatus } from "@/entities/violation";
import { VIOLATION_CREATABLE_STATUSES_ORDERED } from "@/features/violations/lib/violation-status-present";
import { violationsApi } from "@/features/violations/api";
import {
  firstViolationCreateFormErrorMessage,
  parseViolationCreateForm,
} from "@/features/violations/lib/violation-create-form-schema";
import { loadViolationsAdminList } from "@/features/violations/model/violations-state";
import { HttpApiError } from "@/shared/api/http-api-error";
import { ROUTES } from "@/shared/config/routes-paths";
import { LANG_KEYS } from "@/shared/i18n/keys";

export function useViolationCreateSubmit() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const reloadList = useAction(loadViolationsAdminList);

  const [tripId, setTripId] = useState("");
  const [type, setType] = useState<ViolationStatus>(
    VIOLATION_CREATABLE_STATUSES_ORDERED[0],
  );
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const submit = useCallback(async () => {
    setFormError(null);

    const parsed = parseViolationCreateForm({
      tripId,
      type,
      description,
    });
    if (!parsed.success) {
      setFormError(firstViolationCreateFormErrorMessage(parsed));
      return;
    }

    setSubmitting(true);
    try {
      await violationsApi.create(parsed.data);
      notifications.show({
        title: t(LANG_KEYS.pages.violationsEditorNewTitle),
        message: parsed.data.tripId,
        color: "green",
      });
      void reloadList({ includeResolved: true });
      void navigate({ to: ROUTES.dashboard.violations });
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
  }, [description, navigate, reloadList, t, tripId, type]);

  return {
    tripId,
    setTripId,
    type,
    setType,
    description,
    setDescription,
    submitting,
    formError,
    setFormError,
    submit,
  };
}
