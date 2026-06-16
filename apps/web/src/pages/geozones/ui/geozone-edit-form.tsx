import {
  Alert,
  Button,
  ColorInput,
  Select,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useTranslation } from "react-i18next";

import { FIELD_LIMITS } from "@carsharing/validation";

import type { GeozoneType } from "@/entities/geozone";
import type { TariffRead } from "@/entities/tariff";
import { LANG_KEYS } from "@/shared/i18n/keys";

function formatTariffAmount(n: number): string {
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n);
}

type Props = {
  name: string;
  onNameChange: (value: string) => void;
  type: GeozoneType;
  onTypeChange: (value: GeozoneType) => void;
  typeSelectData: { value: string; label: string }[];
  color: string;
  onColorChange: (value: string) => void;
  tariffPresetSelectData: { value: string; label: string }[];
  tariffPresetId: string | null;
  onTariffPresetChange: (value: string | null) => void;
  selectedTariffPreset: TariffRead | null;
  submitting: boolean;
  onSave: () => void;
  saveLabel?: string;
  submitDisabled?: boolean;
};

export function GeozoneEditForm({
  name,
  onNameChange,
  type,
  onTypeChange,
  typeSelectData,
  color,
  onColorChange,
  tariffPresetSelectData,
  tariffPresetId,
  onTariffPresetChange,
  selectedTariffPreset,
  submitting,
  onSave,
  saveLabel,
  submitDisabled = false,
}: Props) {
  const { t } = useTranslation();
  const submitText = saveLabel ?? t(LANG_KEYS.pages.geozonesEditSave);

  return (
    <Stack gap="md">
      <Title order={4}>{t(LANG_KEYS.pages.geozonesCreateSectionForm)}</Title>
      <TextInput
        label={t(LANG_KEYS.pages.geozonesCreateFieldName)}
        value={name}
        onChange={(e) => onNameChange(e.currentTarget.value)}
        minLength={FIELD_LIMITS.GEOZONE_NAME_MIN}
        maxLength={FIELD_LIMITS.GEOZONE_NAME_MAX}
        required
      />
      <Select
        label={t(LANG_KEYS.pages.geozonesCreateFieldType)}
        data={typeSelectData}
        value={type}
        onChange={(v) => {
          if (v) {
            onTypeChange(v as GeozoneType);
          }
        }}
      />
      <ColorInput
        label={t(LANG_KEYS.pages.geozonesCreateFieldColor)}
        value={color}
        onChange={onColorChange}
        format="hex"
        swatches={["#228be6", "#40c057", "#fab005", "#fa5252", "#be4bdb"]}
      />
      <Select
        label={t(LANG_KEYS.pages.geozonesCreateFieldTariffPreset)}
        data={tariffPresetSelectData}
        value={tariffPresetId ?? ""}
        onChange={(v) => {
          onTariffPresetChange(v && v !== "" ? v : null);
        }}
        disabled={tariffPresetSelectData.length === 0}
      />
      <Alert color="gray" variant="light">
        {t(LANG_KEYS.pages.geozonesCreateTariffPresetHint)}
      </Alert>
      {selectedTariffPreset ? (
        <Stack gap={6}>
          <Text size="sm">
            <Text span c="dimmed">
              {t(LANG_KEYS.pages.geozonesCreateFieldPricePerMinute)}
            </Text>{" "}
            <Text span fw={500}>
              {formatTariffAmount(selectedTariffPreset.pricePerMinute)}
            </Text>
          </Text>
          <Text size="sm">
            <Text span c="dimmed">
              {t(LANG_KEYS.pages.geozonesCreateFieldPricePerKm)}
            </Text>{" "}
            <Text span fw={500}>
              {formatTariffAmount(selectedTariffPreset.pricePerKm)}
            </Text>
          </Text>
          <Text size="sm">
            <Text span c="dimmed">
              {t(LANG_KEYS.pages.geozonesCreateFieldPausePricePerMinute)}
            </Text>{" "}
            <Text span fw={500}>
              {formatTariffAmount(selectedTariffPreset.pausePricePerMinute)}
            </Text>
          </Text>
        </Stack>
      ) : null}
      <Button onClick={onSave} loading={submitting} disabled={submitDisabled}>
        {submitText}
      </Button>
    </Stack>
  );
}
