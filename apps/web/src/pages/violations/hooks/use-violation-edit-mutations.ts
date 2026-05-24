import { notifications } from "@mantine/notifications";
import { useAction } from "@reatom/react";
import { useNavigate } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import { ViolationStatus } from "@/entities/violation";
import { isCarEligibleForReturnWizard } from "@/features/cars/lib/car-return-to-service-present";
import { violationsApi } from "@/features/violations/api";
import { tripHistoryApi } from "@/features/trips/api";
import type { ViolationEditLoadPhase } from "@/features/violations/model/violation-edit-view";
import { loadViolationsAdminList } from "@/features/violations/model/violations-state";
import { resolveApiErrorMessage } from "@/shared/api";
import { ROUTES } from "@/shared/config/routes-paths";
import { LANG_KEYS } from "@/shared/i18n/keys";

type Args = {
  violationId: string;
  tripId: string;
  phase: ViolationEditLoadPhase;
  persistedStatus: ViolationStatus | null;
  setPersistedStatus: (status: ViolationStatus) => void;
  statusChoice: ViolationStatus;
  setStatusChoice: (status: ViolationStatus) => void;
};

export function useViolationEditMutations({
  violationId,
  tripId,
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
      setFormError(resolveApiErrorMessage(error));
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

      if (tripId.trim()) {
        try {
          const full = await tripHistoryApi.getFull(tripId);
          const car = full.car;
          if (car && isCarEligibleForReturnWizard(car)) {
            notifications.show({
              title: t(LANG_KEYS.pages.carReturnToServiceAfterResolveTitle),
              message: t(LANG_KEYS.pages.carReturnToServiceAfterResolveBody),
              color: "yellow",
            });
            void navigate({
              to: ROUTES.dashboard.carReturnToService(car.id),
            });
            return;
          }
        } catch {
          // fallback to violations list
        }
      }

      void navigate({ to: ROUTES.dashboard.violations });
    } catch (error) {
      setFormError(resolveApiErrorMessage(error));
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
    tripId,
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
