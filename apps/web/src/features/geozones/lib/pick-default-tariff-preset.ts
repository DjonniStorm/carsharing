import type { TariffRead } from "@/entities/tariff";

export function pickDefaultTariffPresetId(list: TariffRead[]): string | null {
  const def = list.find((p) => p.isDefault);
  return def?.id ?? list[0]?.id ?? null;
}
