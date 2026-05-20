import { NumberInput, Switch, Text, TextInput } from "@mantine/core";
import { useTranslation } from "react-i18next";

import { FIELD_LIMITS } from "@carsharing/validation";

import { LANG_KEYS } from "@/shared/i18n/keys";

export type TariffFormValues = {
  name: string;
  pricePerMinute: number | string;
  pricePerKm: number | string;
  pausePricePerMinute: number | string;
  isDefault: boolean;
};

type Props = {
  values: TariffFormValues;
  readOnly?: boolean;
  onNameChange: (value: string) => void;
  onPricePerMinuteChange: (value: number | string) => void;
  onPricePerKmChange: (value: number | string) => void;
  onPausePricePerMinuteChange: (value: number | string) => void;
  onIsDefaultChange: (checked: boolean) => void;
};

export function TariffFormFields({
  values,
  readOnly = false,
  onNameChange,
  onPricePerMinuteChange,
  onPricePerKmChange,
  onPausePricePerMinuteChange,
  onIsDefaultChange,
}: Props) {
  const { t } = useTranslation();

  return (
    <>
      <TextInput
        label={t(LANG_KEYS.pages.tariffsCreateFieldName)}
        value={values.name}
        onChange={(e) => {
          onNameChange(e.currentTarget.value);
        }}
        minLength={FIELD_LIMITS.TARIFF_NAME_MIN}
        maxLength={FIELD_LIMITS.TARIFF_NAME_MAX}
        required
        readOnly={readOnly}
      />
      <NumberInput
        label={t(LANG_KEYS.pages.tariffsCreateFieldPriceMin)}
        value={values.pricePerMinute}
        onChange={onPricePerMinuteChange}
        min={0}
        max={FIELD_LIMITS.TARIFF_PRICE_MAX}
        decimalScale={2}
        fixedDecimalScale
        readOnly={readOnly}
      />
      <NumberInput
        label={t(LANG_KEYS.pages.tariffsCreateFieldPriceKm)}
        value={values.pricePerKm}
        onChange={onPricePerKmChange}
        min={0}
        max={FIELD_LIMITS.TARIFF_PRICE_MAX}
        decimalScale={2}
        fixedDecimalScale
        readOnly={readOnly}
      />
      <NumberInput
        label={t(LANG_KEYS.pages.tariffsCreateFieldPausePrice)}
        value={values.pausePricePerMinute}
        onChange={onPausePricePerMinuteChange}
        min={0}
        max={FIELD_LIMITS.TARIFF_PRICE_MAX}
        decimalScale={2}
        fixedDecimalScale
        readOnly={readOnly}
      />
      <Switch
        label={t(LANG_KEYS.pages.tariffsCreateFieldIsDefault)}
        checked={values.isDefault}
        onChange={(e) => onIsDefaultChange(e.currentTarget.checked)}
        disabled={readOnly}
      />
      <Text size="xs" c="dimmed">
        {t(LANG_KEYS.pages.tariffsDefaultHelper)}
      </Text>
    </>
  );
}
