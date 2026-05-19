import {
  Button,
  Grid,
  Modal,
  NumberInput,
  Stack,
  TextInput,
} from "@mantine/core";

import { useForm, schemaResolver } from "@mantine/form";

import { useDisclosure } from "@mantine/hooks";

import { wrap } from "@reatom/core";

import { useAction } from "@reatom/react";

import { useEffect, useRef, useState } from "react";

import { useTranslation } from "react-i18next";

import { addCarFormSchema, type AddCarFormOutput } from "@/entities/car";

import { carsApi } from "@/features/cars/api";

import { buildCreateCarBodyFromForm } from "@/features/cars/add-car/lib/build-create-car-body";

import { LANG_KEYS } from "@/shared/i18n/keys";

import { notifyApiError } from "@/shared/lib/notify-api-error";
import { notification } from "@/shared/lib/notification";

type AddCarModalProps = {
  opened: boolean;

  onClose: () => void;

  onCreated?: () => void;
};

const AddCarModal = ({ opened, onClose, onCreated }: AddCarModalProps) => {
  const { t } = useTranslation();

  const [submitting, setSubmitting] = useState(false);

  const form = useForm({
    mode: "uncontrolled",

    initialValues: {
      brand: "",

      model: "",

      licensePlate: "",

      color: "",

      mileage: 0,

      fuelLevel: 100,
    },

    validate: schemaResolver(addCarFormSchema),
  });

  const prevOpenedRef = useRef(false);

  useEffect(() => {
    if (opened && !prevOpenedRef.current) {
      form.reset();
    }

    prevOpenedRef.current = opened;
  }, [opened, form]);

  const handleModalClose = () => {
    form.reset();

    onClose();
  };

  const guardClose = () => {
    if (submitting) {
      return;
    }

    handleModalClose();
  };

  const handleSubmit = useAction(async (values: AddCarFormOutput) => {
    setSubmitting(true);

    try {
      await wrap(carsApi.create(buildCreateCarBodyFromForm(values)));

      notification.success(
        t(LANG_KEYS.pages.carsAddSuccessTitle),

        t(LANG_KEYS.pages.carsAddSuccessBody),
      );

      onCreated?.();

      form.reset();

      onClose();
    } catch (err: unknown) {
      notifyApiError(LANG_KEYS.pages.carsAddErrorTitle, err, {
        fallbackKey: LANG_KEYS.pages.carsAddErrorFallback,
      });
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <Modal
      opened={opened}
      onClose={guardClose}
      title={t(LANG_KEYS.pages.carsAddModalTitle)}
      size="lg"
      centered
      closeOnClickOutside={!submitting}
      closeOnEscape={!submitting}
      closeButtonProps={{ disabled: submitting }}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <Grid>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <TextInput
                withAsterisk
                label={t(LANG_KEYS.pages.carsAddFieldBrand)}
                key={form.key("brand")}
                placeholder="Toyota"
                {...form.getInputProps("brand")}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6 }}>
              <TextInput
                withAsterisk
                label={t(LANG_KEYS.pages.carsAddFieldModel)}
                key={form.key("model")}
                placeholder="Camry"
                {...form.getInputProps("model")}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6 }}>
              <TextInput
                withAsterisk
                label={t(LANG_KEYS.pages.carsAddFieldPlate)}
                key={form.key("licensePlate")}
                placeholder="A000AA777"
                {...form.getInputProps("licensePlate")}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6 }}>
              <TextInput
                withAsterisk
                label={t(LANG_KEYS.pages.carsAddFieldColor)}
                key={form.key("color")}
                placeholder="Red"
                {...form.getInputProps("color")}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6 }}>
              <NumberInput
                label={t(LANG_KEYS.pages.carsAddFieldMileage)}
                min={0}
                key={form.key("mileage")}
                placeholder="10000"
                {...form.getInputProps("mileage")}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6 }}>
              <NumberInput
                label={t(LANG_KEYS.pages.carsAddFieldFuel)}
                min={0}
                max={100}
                key={form.key("fuelLevel")}
                placeholder="100"
                {...form.getInputProps("fuelLevel")}
              />
            </Grid.Col>
          </Grid>

          <Button type="submit" loading={submitting}>
            {t(LANG_KEYS.pages.carsAddSubmit)}
          </Button>
        </Stack>
      </form>
    </Modal>
  );
};

AddCarModal.displayName = "AddCarModal";

type AddCarToolbarButtonProps = {
  onCreated?: () => void;
};

const AddCarToolbarButton = ({ onCreated }: AddCarToolbarButtonProps) => {
  const { t } = useTranslation();

  const [opened, { open, close }] = useDisclosure(false);

  return (
    <>
      <Button onClick={open}>{t(LANG_KEYS.pages.carsAddButton)}</Button>

      <AddCarModal opened={opened} onClose={close} onCreated={onCreated} />
    </>
  );
};

AddCarToolbarButton.displayName = "AddCarToolbarButton";

export { AddCarModal, AddCarToolbarButton };
