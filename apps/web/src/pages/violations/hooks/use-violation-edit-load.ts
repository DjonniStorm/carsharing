import { useAction, useAtom } from "@reatom/react";
import { useParams } from "@tanstack/react-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import {
  failViolationEditNotFound,
  loadViolationEditPage,
  resetViolationEditPage,
  violationEditDescriptionAtom,
  violationEditLoadErrorAtom,
  violationEditLoadPhaseAtom,
  violationEditPersistedStatusAtom,
  violationEditStatusChoiceAtom,
  violationEditTripIdAtom,
} from "@/features/violations/model/violation-edit-view";
import { LANG_KEYS } from "@/shared/i18n/keys";

export function useViolationEditLoad() {
  const { t } = useTranslation();
  const params = useParams({ strict: false }) as { violationId?: string };
  const violationId = params.violationId ?? "";

  const [phase] = useAtom(violationEditLoadPhaseAtom);
  const [loadErrorRaw] = useAtom(violationEditLoadErrorAtom);
  const [tripId] = useAtom(violationEditTripIdAtom);
  const [description] = useAtom(violationEditDescriptionAtom);
  const [persistedStatus, setPersistedStatus] = useAtom(
    violationEditPersistedStatusAtom,
  );
  const [statusChoice, setStatusChoice] = useAtom(violationEditStatusChoiceAtom);

  const loadPage = useAction(loadViolationEditPage);
  const resetPage = useAction(resetViolationEditPage);
  const failNotFound = useAction(failViolationEditNotFound);

  const loadError =
    loadErrorRaw === "not_found"
      ? t(LANG_KEYS.pages.violationsEditNotFound)
      : loadErrorRaw;

  useEffect(() => {
    if (!violationId) {
      resetPage();
      failNotFound();
      return;
    }
    resetPage();
    void loadPage(violationId);
    return () => {
      resetPage();
    };
  }, [failNotFound, loadPage, resetPage, violationId]);

  return {
    violationId,
    phase,
    loadError,
    tripId,
    description,
    persistedStatus,
    setPersistedStatus,
    statusChoice,
    setStatusChoice,
  };
}
