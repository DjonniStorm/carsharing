import type { TariffEditSnapshot } from "@/features/tariffs/model/tariff-edit-view";

import {
  firstTariffFormErrorMessage,
  parseTariffFormInput,
  tariffSnapshotFromParsed,
  type TariffFormInput,
} from "@/features/tariffs/lib/tariff-form-schema";

export type { TariffFormInput };

/** @deprecated Prefer `parseTariffFormInput` + `tariffSnapshotFromParsed`. */
export function tariffSnapshotFromForm(
  name: string,
  pricePerMinute: number | string,
  pricePerKm: number | string,
  pausePricePerMinute: number | string,
  isDefault: boolean,
): TariffEditSnapshot | null {
  const result = parseTariffFormInput({
    name,
    pricePerMinute,
    pricePerKm,
    pausePricePerMinute,
    isDefault,
  });
  if (!result.success) {
    return null;
  }
  return tariffSnapshotFromParsed(result.data);
}

export {
  firstTariffFormErrorMessage,
  parseTariffFormInput,
  tariffSnapshotFromParsed,
};
