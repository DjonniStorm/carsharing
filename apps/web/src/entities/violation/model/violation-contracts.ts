import type { ViolationStatus } from "@/entities/violation/model/violation-status";

export type ViolationRead = {
  id: string;
  tripId: string;
  type: ViolationStatus;
  description: string;
  createdAt: string;
};

export type ViolationCreateBody = {
  tripId: string;
  type: ViolationStatus;
  description: string;
};

export type ViolationUpdateStatusBody = {
  status: ViolationStatus;
};
