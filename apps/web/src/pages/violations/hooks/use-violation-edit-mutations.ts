import { notifications } from "@mantine/notifications";
import { useAction } from "@reatom/react";
import { useNavigate } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import { ViolationStatus } from "@/entities/violation";
import { violationsApi } from "@/features/violations/api";
import type { ViolationEditLoadPhase } from "@/features/violations/model/violation-edit-view";
import { loadViolationsAdminList } from "@/features/violations/model/violations-state";
import { HttpApiError } from "@/shared/api/http-api-error";
import { ROUTES } from "@/shared/config/routes-paths";
import { LANG_KEYS } from "@/shared/i18n/keys";

type Args = {
  violationId: string;
  phase: ViolationEditLoadPhase;
  persistedStatus: ViolationStatus | null;
  setPersistedStatus: (status: ViolationStatus) => void;
  statusChoice: ViolationStatus;
  setStatusChoice: (status: ViolationStatus) => void;
};

export function useViolationEditMutations({
  violationId,
  phase,
  persistedStatus,
  setPersistedStatus,
  statusChoice,
  setStatusChoice,
}: Args) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const reloadList = useAction(loadViolationsAdminList);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const saveStatus = useCallback(async () => {
    setFormError(null);
    if (!violationId || phase !== "ok") {
      return;
    }
    if (persistedStatus === null || statusChoice === persistedStatus) {
      notifications.show({
        message: t(LANG_KEYS.pages.violationsEditNothingToSave),
        color: "blue",
      });
      return;
    }

    setSubmitting(true);
    try {
      await violationsApi.updateStatus(violationId, { status: statusChoice });
      setPersistedStatus(statusChoice);
      notifications.show({
        title: t(LANG_KEYS.pages.violationsEditSuccess),
        message: "",
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
  }, [
    navigate,
    phase,
    persistedStatus,
    reloadList,
    setPersistedStatus,
    statusChoice,
    t,
    violationId,
  ]);

  const markResolved = useCallback(async () => {
    setFormError(null);
    if (!violationId || phase !== "ok") {
      return;
    }

    setSubmitting(true);
    try {
      await violationsApi.resolve(violationId);
      setPersistedStatus(ViolationStatus.RESOLVED);
      setStatusChoice(ViolationStatus.RESOLVED);
      notifications.show({
        title: t(LANG_KEYS.pages.violationsEditSuccess),
        message: t(LANG_KEYS.pages.violationsKindResolved),
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
  }, [
    navigate,
    phase,
    reloadList,
    setPersistedStatus,
    setStatusChoice,
    t,
    violationId,
  ]);

  return {
    submitting,
    formError,
    setFormError,
    saveStatus,
    markResolved,
  };
}
