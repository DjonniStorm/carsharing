import type { AsyncStatus } from "@/shared/model/async-status";

export type TripViewEmailNoticesPhase = "loading" | "ok" | "error";

export function emailNoticesPhaseFromStatus(
  status: AsyncStatus,
): TripViewEmailNoticesPhase {
  if (status === "loading") {
    return "loading";
  }
  if (status === "error") {
    return "error";
  }
  return "ok";
}
