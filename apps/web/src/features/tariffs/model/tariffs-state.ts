import { action, atom, wrap } from "@reatom/core";

import type { TariffRead } from "@/entities/tariff";
import { tariffsApi } from "@/features/tariffs/api";

import type { AsyncStatus } from "@/shared/model/async-status";

export const tariffsCatalogAtom = atom<TariffRead[] | null>(
  null,
  "tariffsCatalog",
);

export const tariffsCatalogStatusAtom = atom<AsyncStatus>(
  "idle",
  "tariffsCatalogStatus",
);

export const tariffsCatalogErrorAtom = atom<string | null>(
  null,
  "tariffsCatalogError",
);

export const resetTariffsCatalogState = action(() => {
  tariffsCatalogAtom.set(null);
  tariffsCatalogStatusAtom.set("idle");
  tariffsCatalogErrorAtom.set(null);
}, "resetTariffsCatalogState");

export const loadTariffsCatalog = action(
  async (opts?: { includeDeleted?: boolean }) => {
    tariffsCatalogStatusAtom.set("loading");
    tariffsCatalogErrorAtom.set(null);
    try {
      const list = await wrap(
        tariffsApi.findAll({
          includeDeleted: opts?.includeDeleted ?? true,
        }),
      );
      tariffsCatalogAtom.set(list);
      tariffsCatalogStatusAtom.set("idle");
    } catch (e) {
      tariffsCatalogStatusAtom.set("error");
      tariffsCatalogErrorAtom.set(e instanceof Error ? e.message : String(e));
    }
  },
  "loadTariffsCatalog",
);
