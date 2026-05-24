import { useCallback, useState } from "react";

import { CarStatus } from "@/entities/car";
import { carsApi } from "@/features/cars/api";
import {
  isCarEligibleForReturnWizard,
  isManagerCommentValid,
} from "@/features/cars/lib/car-return-to-service-present";
import { loadCarsList } from "@/features/cars/model/cars-list";
import { useAction } from "@reatom/react";
import { resolveApiErrorMessage } from "@/shared/api";

import { useCarReturnToServiceLoad } from "@/pages/cars/hooks/use-car-return-to-service-load";

export type ReturnChecklist = {
  parkingChecked: boolean;
  fuelChecked: boolean;
  vehicleChecked: boolean;
  driverContactChecked: boolean;
};

const emptyChecklist = (): ReturnChecklist => ({
  parkingChecked: false,
  fuelChecked: false,
  vehicleChecked: false,
  driverContactChecked: false,
});

export function useCarReturnToServicePage(carId: string) {
  const reloadFleet = useAction(loadCarsList);
  const load = useCarReturnToServiceLoad(carId);

  const [activeStep, setActiveStep] = useState(0);
  const [checklist, setChecklist] = useState<ReturnChecklist>(emptyChecklist);
  const [comment, setComment] = useState("");
  const [confirmReady, setConfirmReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const requiredChecksDone =
    checklist.parkingChecked &&
    checklist.fuelChecked &&
    checklist.vehicleChecked;

  const commentValid = isManagerCommentValid(comment);

  const canGoToChecklist = load.phase === "ok" && load.car != null;
  const canGoToConfirm = canGoToChecklist && requiredChecksDone && commentValid;
  const canSubmit =
    canGoToConfirm && confirmReady && !submitting && load.car != null;

  const nextStep = useCallback(() => {
    setActiveStep((s) => Math.min(s + 1, 2));
  }, []);

  const prevStep = useCallback(() => {
    setActiveStep((s) => Math.max(s - 1, 0));
  }, []);

  const submit = useCallback(async () => {
    if (!load.car || !canSubmit) {
      return;
    }
    setFormError(null);
    setSubmitting(true);
    try {
      await carsApi.update(load.car.id, {
        carStatus: CarStatus.AVAILABLE,
        isAvailable: true,
      });
      void reloadFleet(false);
      setSuccess(true);
    } catch (e) {
      setFormError(resolveApiErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  }, [canSubmit, load.car, reloadFleet]);

  const alreadyAvailable =
    load.phase === "ok" &&
    load.car != null &&
    !isCarEligibleForReturnWizard(load.car);

  return {
    ...load,
    activeStep,
    setActiveStep,
    checklist,
    setChecklist,
    comment,
    setComment,
    confirmReady,
    setConfirmReady,
    submitting,
    formError,
    setFormError,
    success,
    canGoToChecklist,
    canGoToConfirm,
    canSubmit,
    requiredChecksDone,
    commentValid,
    nextStep,
    prevStep,
    submit,
    alreadyAvailable,
  };
}
