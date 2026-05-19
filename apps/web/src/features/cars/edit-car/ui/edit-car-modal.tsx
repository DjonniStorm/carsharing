import { Button, Grid, Modal, Stack, Text, TextInput } from "@mantine/core";
import { useForm, schemaResolver } from "@mantine/form";
import { wrap } from "@reatom/core";
import { useAction } from "@reatom/react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import type { CarRead, CarUpdateBody } from "@/entities/car";
import { carsApi } from "@/features/cars/api";
import {
  editCarBasicsFormSchema,
  type EditCarBasicsFormOutput,
} from "@/features/cars/edit-car/lib/edit-car-basics-form-schema";
import { LANG_KEYS } from "@/shared/i18n/keys";
import { notifyApiError } from "@/shared/lib/notify-api-error";
import { notification } from "@/shared/lib/notification";

type EditCarModalProps = {
  car: CarRead | null;
  opened: boolean;
  onClose: () => void;
  onSaved?: () => void;
};

const EditCarModal = ({ car, opened, onClose, onSaved }: EditCarModalProps) => {
  const { t } = useTranslation();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<EditCarBasicsFormOutput>({
    mode: "uncontrolled",
    initialValues: { brand: "", model: "", color: "" },
    validate: schemaResolver(editCarBasicsFormSchema),
  });

  useEffect(() => {
    if (!opened || !car) {
      return;
    }
    form.setValues({
      brand: car.brand,
      model: car.model,
      color: car.color,
    });
  }, [opened, car?.id, car?.brand, car?.model, car?.color]);

  const guardClose = () => {
    if (submitting) {
      return;
    }
    onClose();
  };

  const handleSubmit = useAction(async (values: EditCarBasicsFormOutput) => {
    if (!car) {
      return;
    }
    setSubmitting(true);
    try {
      const body: CarUpdateBody = {
        brand: values.brand,
        model: values.model,
        color: values.color,
      };
      await wrap(carsApi.update(car.id, body));
      notification.success(
        t(LANG_KEYS.pages.carsEditSuccessTitle),
        t(LANG_KEYS.pages.carsEditSuccessBody),
      );
      onSaved?.();
      onClose();
    } catch (err: unknown) {
      notifyApiError(LANG_KEYS.pages.carsEditErrorTitle, err, {
        fallbackKey: LANG_KEYS.pages.carsEditErrorFallback,
      });
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <Modal
      opened={opened}
      onClose={guardClose}
      title={t(LANG_KEYS.pages.carsEditModalTitle)}
      size="lg"
      centered
      closeOnClickOutside={!submitting}
      closeOnEscape={!submitting}
      closeButtonProps={{ disabled: submitting }}
    >
      {car ? (
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <Text size="sm" c="dimmed" ff="monospace">
              {car.licensePlate}
            </Text>
            <Grid>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput
                  withAsterisk
                  label={t(LANG_KEYS.pages.carsAddFieldBrand)}
                  key={form.key("brand")}
                  {...form.getInputProps("brand")}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput
                  withAsterisk
                  label={t(LANG_KEYS.pages.carsAddFieldModel)}
                  key={form.key("model")}
                  {...form.getInputProps("model")}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput
                  withAsterisk
                  label={t(LANG_KEYS.pages.carsAddFieldColor)}
                  key={form.key("color")}
                  {...form.getInputProps("color")}
                />
              </Grid.Col>
            </Grid>
            <Button type="submit" loading={submitting}>
              {t(LANG_KEYS.pages.carsEditSubmit)}
            </Button>
          </Stack>
        </form>
      ) : null}
    </Modal>
  );
};
EditCarModal.displayName = "EditCarModal";

export { EditCarModal };
