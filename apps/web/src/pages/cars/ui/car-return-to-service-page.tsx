import {
  Alert,
  Button,
  Checkbox,
  Container,
  Group,
  Loader,
  Paper,
  Stack,
  Stepper,
  Text,
  Textarea,
  Title,
} from "@mantine/core";
import { Link, useParams } from "@tanstack/react-router";
import confetti from "canvas-confetti";
import { useEffect, type ChangeEvent } from "react";
import { useTranslation } from "react-i18next";

import {
  carStatusLangKey,
} from "@/features/cars/lib/car-status-present";
import {
  MANAGER_COMMENT_MAX_LEN,
  MANAGER_COMMENT_MIN_LEN,
} from "@/features/cars/lib/car-return-to-service-present";
import { ViolationStatus } from "@/entities/violation";
import {
  violationStatusLangKey,
  VIOLATION_STATUSES_ORDERED,
} from "@/features/violations/lib/violation-status-present";
import { ROUTES } from "@/shared/config/routes-paths";
import { formatCardDateTime, formatCoord, formatQuantity } from "@/shared/lib/format";
import { LANG_KEYS } from "@/shared/i18n/keys";

import { useCarReturnToServicePage } from "@/pages/cars/hooks/use-car-return-to-service-page";
import type { ReturnChecklist } from "@/pages/cars/hooks/use-car-return-to-service-page";

const readCheckboxChecked = (event: ChangeEvent<HTMLInputElement>): boolean =>
  event.currentTarget.checked;

const CarReturnToServicePage = () => {
  const { t, i18n } = useTranslation();
  const { carId } = useParams({
    from: "/dashboard-shell/dashboard/cars/$carId/return-to-service",
  });
  const vm = useCarReturnToServicePage(carId);
  const locale = i18n.language;

  const patchChecklist = (field: keyof ReturnChecklist, checked: boolean) => {
    vm.setChecklist((prev) => ({ ...prev, [field]: checked }));
  };

  useEffect(() => {
    if (!vm.success) {
      return;
    }
    confetti({
      particleCount: 120,
      spread: 72,
      origin: { y: 0.65 },
    });
  }, [vm.success]);

  if (vm.phase === "loading") {
    return (
      <Container size="sm" py="xl">
        <Group justify="center">
          <Loader />
        </Group>
      </Container>
    );
  }

  if (vm.phase === "error" || !vm.car) {
    return (
      <Container size="sm" py="md">
        <Stack gap="md">
          <Title order={2}>{t(LANG_KEYS.pages.carReturnToServiceTitle)}</Title>
          <Alert color="red">{vm.error ?? t(LANG_KEYS.pages.carReturnToServiceLoadError)}</Alert>
          <Link to={ROUTES.dashboard.cars} style={{ textDecoration: "none" }}>
            <Button component="span" variant="default">
              {t(LANG_KEYS.pages.carReturnToServiceBackToFleet)}
            </Button>
          </Link>
        </Stack>
      </Container>
    );
  }

  if (vm.success || vm.alreadyAvailable) {
    return (
      <Container size="sm" py="md">
        <Stack gap="lg">
          <Title order={2}>{t(LANG_KEYS.pages.carReturnToServiceSuccessTitle)}</Title>
          <Alert color="green" variant="light">
            {vm.alreadyAvailable
              ? t(LANG_KEYS.pages.carReturnToServiceAlreadyAvailable, {
                  plate: vm.car.licensePlate,
                })
              : t(LANG_KEYS.pages.carReturnToServiceSuccessBody, {
                  plate: vm.car.licensePlate,
                })}
          </Alert>
          <Group gap="sm">
            <Link to={ROUTES.dashboard.cars} style={{ textDecoration: "none" }}>
              <Button component="span">{t(LANG_KEYS.pages.carReturnToServiceBackToFleet)}</Button>
            </Link>
            <Link to={ROUTES.dashboard.overview} style={{ textDecoration: "none" }}>
              <Button component="span" variant="light">
                {t(LANG_KEYS.pages.carReturnToServiceBackToMap)}
              </Button>
            </Link>
          </Group>
        </Stack>
      </Container>
    );
  }

  const violationLabel = (type: ViolationStatus) => {
    const key = violationStatusLangKey(type);
    return VIOLATION_STATUSES_ORDERED.includes(type) ? t(key) : String(type);
  };

  return (
    <Container size="sm" py="md" px="md">
      <Stack gap="lg">
        <Group justify="space-between" align="flex-start">
          <Stack gap={4}>
            <Title order={2}>{t(LANG_KEYS.pages.carReturnToServiceTitle)}</Title>
            <Text size="sm" c="dimmed">
              {t(LANG_KEYS.pages.carReturnToServiceIntro)}
            </Text>
          </Stack>
          <Link to={ROUTES.dashboard.cars} style={{ textDecoration: "none" }}>
            <Button component="span" variant="default">
              {t(LANG_KEYS.pages.carReturnToServiceCancel)}
            </Button>
          </Link>
        </Group>

        {vm.formError ? (
          <Alert color="red" onClose={() => vm.setFormError(null)} withCloseButton>
            {vm.formError}
          </Alert>
        ) : null}

        <Stepper active={vm.activeStep} allowNextStepsSelect={false}>
          <Stepper.Step label={t(LANG_KEYS.pages.carReturnToServiceStepDiagnosis)}>
            <Paper p="md" withBorder radius="md" mt="md">
              <Stack gap="sm">
                <Text fw={700}>{vm.car.licensePlate}</Text>
                <Text size="sm" c="dimmed">
                  {vm.car.brand} {vm.car.model}
                </Text>
                <Text size="sm">
                  {t(LANG_KEYS.pages.carReturnToServiceCurrentStatus)}:{" "}
                  {t(carStatusLangKey(vm.car.carStatus))}
                </Text>
                <Text size="sm">
                  {t(LANG_KEYS.pages.carsAddFieldFuel)}:{" "}
                  {formatQuantity(vm.car.fuelLevel, "%", locale)}
                </Text>
                <Text size="sm">
                  {t(LANG_KEYS.pages.carsColPosition)}:{" "}
                  {formatCoord(vm.car.lastKnownLat, vm.car.lastKnownLon)}
                </Text>
                {vm.car.lastPositionAt ? (
                  <Text size="sm" c="dimmed">
                    {formatCardDateTime(vm.car.lastPositionAt, locale)}
                  </Text>
                ) : null}

                <Text fw={600} mt="sm">
                  {t(LANG_KEYS.pages.carReturnToServiceBlockingViolations)}
                </Text>
                {vm.blockingViolations.length === 0 ? (
                  <Text size="sm" c="dimmed">
                    {t(LANG_KEYS.pages.carReturnToServiceNoBlockingViolations)}
                  </Text>
                ) : (
                  <Stack gap="xs">
                    <Text size="sm" c="dimmed">
                      {t(LANG_KEYS.pages.carReturnToServiceViolationsHint)}
                    </Text>
                    {vm.blockingViolations.map((v) => (
                      <Paper key={v.id} p="sm" withBorder radius="sm">
                        <Stack gap={4}>
                          <Text size="sm" fw={600}>
                            {violationLabel(v.type)}
                          </Text>
                          <Text size="xs" c="dimmed" lineClamp={2}>
                            {v.description}
                          </Text>
                          <Group gap="xs">
                            <Link
                              to={ROUTES.dashboard.violationsEdit(v.id)}
                              style={{ textDecoration: "none" }}
                            >
                              <Button component="span" size="xs" variant="light">
                                {t(LANG_KEYS.pages.carReturnToServiceFixViolation)}
                              </Button>
                            </Link>
                            {vm.tripId ? (
                              <Link
                                to={ROUTES.dashboard.tripView(vm.tripId)}
                                style={{ textDecoration: "none" }}
                              >
                                <Button component="span" size="xs" variant="subtle">
                                  {t(LANG_KEYS.pages.carReturnToServiceOpenTrip)}
                                </Button>
                              </Link>
                            ) : null}
                          </Group>
                        </Stack>
                      </Paper>
                    ))}
                  </Stack>
                )}
              </Stack>
            </Paper>
          </Stepper.Step>

          <Stepper.Step label={t(LANG_KEYS.pages.carReturnToServiceStepChecklist)}>
            <Paper p="md" withBorder radius="md" mt="md">
              <Stack gap="md">
                <Checkbox
                  label={t(LANG_KEYS.pages.carReturnToServiceCheckParking)}
                  checked={vm.checklist.parkingChecked}
                  onChange={(event) => {
                    patchChecklist("parkingChecked", readCheckboxChecked(event));
                  }}
                />
                <Checkbox
                  label={t(LANG_KEYS.pages.carReturnToServiceCheckFuel)}
                  checked={vm.checklist.fuelChecked}
                  onChange={(event) => {
                    patchChecklist("fuelChecked", readCheckboxChecked(event));
                  }}
                />
                <Checkbox
                  label={t(LANG_KEYS.pages.carReturnToServiceCheckVehicle)}
                  checked={vm.checklist.vehicleChecked}
                  onChange={(event) => {
                    patchChecklist("vehicleChecked", readCheckboxChecked(event));
                  }}
                />
                <Checkbox
                  label={t(LANG_KEYS.pages.carReturnToServiceCheckDriverContact)}
                  checked={vm.checklist.driverContactChecked}
                  onChange={(event) => {
                    patchChecklist(
                      "driverContactChecked",
                      readCheckboxChecked(event),
                    );
                  }}
                />
                <Textarea
                  label={t(LANG_KEYS.pages.carReturnToServiceManagerComment)}
                  description={t(LANG_KEYS.pages.carReturnToServiceManagerCommentHint, {
                    min: MANAGER_COMMENT_MIN_LEN,
                    max: MANAGER_COMMENT_MAX_LEN,
                  })}
                  value={vm.comment}
                  onChange={(e) => vm.setComment(e.currentTarget.value)}
                  maxLength={MANAGER_COMMENT_MAX_LEN}
                  autosize
                  minRows={4}
                  required
                />
              </Stack>
            </Paper>
          </Stepper.Step>

          <Stepper.Step label={t(LANG_KEYS.pages.carReturnToServiceStepConfirm)}>
            <Paper p="md" withBorder radius="md" mt="md">
              <Stack gap="md">
                <Text fw={700}>{vm.car.licensePlate}</Text>
                <Text size="sm">{t(carStatusLangKey(vm.car.carStatus))}</Text>
                <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
                  {vm.comment.trim()}
                </Text>
                <Checkbox
                  label={t(LANG_KEYS.pages.carReturnToServiceConfirmReady)}
                  checked={vm.confirmReady}
                  onChange={(event) => {
                    vm.setConfirmReady(readCheckboxChecked(event));
                  }}
                />
              </Stack>
            </Paper>
          </Stepper.Step>
        </Stepper>

        <Group justify="space-between">
          <Button variant="default" disabled={vm.activeStep === 0} onClick={vm.prevStep}>
            {t(LANG_KEYS.pages.carReturnToServiceBack)}
          </Button>
          {vm.activeStep < 2 ? (
            <Button
              onClick={vm.nextStep}
              disabled={
                (vm.activeStep === 0 && !vm.canGoToChecklist) ||
                (vm.activeStep === 1 && !vm.canGoToConfirm)
              }
            >
              {t(LANG_KEYS.pages.carReturnToServiceNext)}
            </Button>
          ) : (
            <Button loading={vm.submitting} disabled={!vm.canSubmit} onClick={() => void vm.submit()}>
              {t(LANG_KEYS.pages.carReturnToServiceSubmit)}
            </Button>
          )}
        </Group>
      </Stack>
    </Container>
  );
};
CarReturnToServicePage.displayName = "CarReturnToServicePage";

export { CarReturnToServicePage };
