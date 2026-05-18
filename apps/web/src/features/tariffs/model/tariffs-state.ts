import { action, atom, wrap } from "@reatom/core";

import type {
  TariffCreateBody,
  TariffRead,
  TariffUpdateBody,
} from "@/entities/tariff";
import { tariffsApi } from "@/features/tariffs/api";
import {
  tariffEditIsDeletedAtom,
  tariffEditSnapshotAtom,
} from "@/features/tariffs/model/tariff-edit-view";
import { HttpApiError } from "@/shared/api/http-api-error";

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

function applyTariffToCatalog(updated: TariffRead): void {
  const rows = tariffsCatalogAtom();
  if (rows == null) {
    return;
  }

  let next = rows.map((row) => {
    if (row.id === updated.id) {
      return updated;
    }
    if (updated.isDefault && !updated.isDeleted && row.isDefault) {
      return { ...row, isDefault: false };
    }
    return row;
  });

  if (!next.some((row) => row.id === updated.id)) {
    next = [...next, updated];
  }

  tariffsCatalogAtom.set(next);
}

function applyTariffDeletedInCatalog(id: string): void {
  const rows = tariffsCatalogAtom();
  if (rows == null) {
    return;
  }

  tariffsCatalogAtom.set(
    rows.map((row) => (row.id === id ? { ...row, isDeleted: true } : row)),
  );
}

function applyTariffEditFromRead(updated: TariffRead): void {
  tariffEditIsDeletedAtom.set(updated.isDeleted);
  tariffEditSnapshotAtom.set({
    name: updated.name.trim(),
    pricePerMinute: updated.pricePerMinute,
    pricePerKm: updated.pricePerKm,
    pausePricePerMinute: updated.pausePricePerMinute,
    isDefault: updated.isDefault,
  });
}

export const resetTariffsCatalogState = action(() => {
  tariffsCatalogAtom.set(null);
  tariffsCatalogStatusAtom.set("idle");
  tariffsCatalogErrorAtom.set(null);
}, "resetTariffsCatalogState");

export const loadTariffsCatalog = action(
  async (opts?: { includeDeleted?: boolean; silent?: boolean }) => {
    if (!opts?.silent) {
      tariffsCatalogStatusAtom.set("loading");
    }
    tariffsCatalogErrorAtom.set(null);
    try {
      const list = await wrap(
        tariffsApi.findAll({
          includeDeleted: opts?.includeDeleted ?? true,
        }),
      );
      tariffsCatalogAtom.set(list);
      tariffsCatalogStatusAtom.set("idle");
    } catch (error) {
      tariffsCatalogStatusAtom.set("error");
      tariffsCatalogErrorAtom.set(
        error instanceof Error ? error.message : String(error),
      );
    }
  },
  "loadTariffsCatalog",
);

export const refreshTariffsCatalogAfterMutation = action(async () => {
  if (tariffsCatalogAtom() == null) {
    await wrap(loadTariffsCatalog({ includeDeleted: true }));
  } else {
    await wrap(loadTariffsCatalog({ includeDeleted: true, silent: true }));
  }
}, "refreshTariffsCatalogAfterMutation");

export const saveTariffFromEdit = action(
  async (input: { id: string; body: TariffUpdateBody }) => {
    const updated = await wrap(tariffsApi.update(input.id, input.body));
    applyTariffToCatalog(updated);
    applyTariffEditFromRead(updated);
    return updated;
  },
  "saveTariffFromEdit",
);

export type DeleteTariffFromEditResult = {
  alreadyDeleted: boolean;
};

export const deleteTariffFromEdit = action(
  async (id: string): Promise<DeleteTariffFromEditResult> => {
    try {
      const updated = await wrap(tariffsApi.delete(id));
      if (updated?.id) {
        applyTariffToCatalog(updated);
      } else {
        applyTariffDeletedInCatalog(id);
      }
      tariffEditIsDeletedAtom.set(true);
      return { alreadyDeleted: false };
    } catch (error) {
      if (error instanceof HttpApiError && error.status === 409) {
        applyTariffDeletedInCatalog(id);
        tariffEditIsDeletedAtom.set(true);
        return { alreadyDeleted: true };
      }
      throw error;
    }
  },
  "deleteTariffFromEdit",
);

export const createTariffInCatalog = action(async (body: TariffCreateBody) => {
  const created = await wrap(tariffsApi.create(body));
  if (tariffsCatalogAtom() == null) {
    await wrap(loadTariffsCatalog({ includeDeleted: true }));
  } else {
    applyTariffToCatalog(created);
  }
  return created;
}, "createTariffInCatalog");

export const setTariffAsDefault = action(async (id: string) => {
  tariffsCatalogErrorAtom.set(null);
  const updated = await wrap(tariffsApi.update(id, { isDefault: true }));
  applyTariffToCatalog(updated);
  return updated;
}, "setTariffAsDefault");
