import { action, atom, wrap } from "@reatom/core";

import { ViolationStatus } from "@/entities/violation";
import { violationsApi } from "@/features/violations/api";
import { HttpApiError, resolveApiErrorMessage } from "@/shared/api";

export type ViolationEditLoadPhase = "loading" | "ok" | "error";

export const violationEditLoadPhaseAtom = atom<ViolationEditLoadPhase>(
  "loading",
  "violationEditLoadPhase",
);

export const violationEditLoadErrorAtom = atom<string | null>(
  null,
  "violationEditLoadError",
);

export const violationEditTripIdAtom = atom("", "violationEditTripId");

export const violationEditDescriptionAtom = atom(
  "",
  "violationEditDescription",
);

export const violationEditPersistedStatusAtom = atom<ViolationStatus | null>(
  null,
  "violationEditPersistedStatus",
);

export const violationEditStatusChoiceAtom = atom<ViolationStatus>(
  ViolationStatus.UNKNOWN,
  "violationEditStatusChoice",
);

let violationEditLoadSeq = 0;

export const resetViolationEditPage = action(() => {
  violationEditLoadSeq += 1;
  violationEditLoadPhaseAtom.set("loading");
  violationEditLoadErrorAtom.set(null);
  violationEditTripIdAtom.set("");
  violationEditDescriptionAtom.set("");
  violationEditPersistedStatusAtom.set(null);
  violationEditStatusChoiceAtom.set(ViolationStatus.UNKNOWN);
}, "resetViolationEditPage");

export const failViolationEditNotFound = action(() => {
  violationEditLoadPhaseAtom.set("error");
  violationEditLoadErrorAtom.set("not_found");
}, "failViolationEditNotFound");

export const loadViolationEditPage = action(async (violationId: string) => {
  const seq = ++violationEditLoadSeq;
  violationEditLoadPhaseAtom.set("loading");
  violationEditLoadErrorAtom.set(null);

  try {
    const v = await wrap(violationsApi.findById(violationId));
    if (seq !== violationEditLoadSeq) {
      return;
    }
    violationEditTripIdAtom.set(v.tripId);
    violationEditDescriptionAtom.set(v.description);
    violationEditPersistedStatusAtom.set(v.type);
    violationEditStatusChoiceAtom.set(v.type);
    violationEditLoadPhaseAtom.set("ok");
  } catch (e) {
    if (seq !== violationEditLoadSeq) {
      return;
    }
    const msg =
      e instanceof HttpApiError && e.status === 404
        ? "not_found"
        : resolveApiErrorMessage(e);
    violationEditLoadErrorAtom.set(msg);
    violationEditLoadPhaseAtom.set("error");
  }
}, "loadViolationEditPage");
