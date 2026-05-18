import { useAction, useAtom } from "@reatom/react";
import { useParams } from "@tanstack/react-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import {
  failGeozoneEditNotFound,
  geozoneEditHydrationAtom,
  geozoneEditLoadErrorAtom,
  geozoneEditLoadPhaseAtom,
  loadGeozoneEditPage,
  resetGeozoneEditPage,
} from "@/features/geozones/model/geozone-edit-view";
import { LANG_KEYS } from "@/shared/i18n/keys";

export function useGeozoneEditLoad() {
  const { t } = useTranslation();
  const loadPage = useAction(loadGeozoneEditPage);
  const resetPage = useAction(resetGeozoneEditPage);
  const failNotFound = useAction(failGeozoneEditNotFound);

  const params = useParams({ strict: false }) as { geozoneId?: string };
  const geozoneId = params.geozoneId ?? "";

  const [loadPhase] = useAtom(geozoneEditLoadPhaseAtom);
  const [loadErrorRaw] = useAtom(geozoneEditLoadErrorAtom);
  const [hydration] = useAtom(geozoneEditHydrationAtom);

  const loadError =
    loadErrorRaw === "not_found"
      ? t(LANG_KEYS.pages.geozonesEditNotFound)
      : loadErrorRaw;

  useEffect(() => {
    if (!geozoneId) {
      resetPage();
      failNotFound();
      return;
    }
    resetPage();
    void loadPage(geozoneId);
    return () => {
      resetPage();
    };
  }, [failNotFound, geozoneId, loadPage, resetPage]);

  return {
    geozoneId,
    loadPhase,
    loadError,
    hydration,
  };
}
